import { Component, ViewChild, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, firstValueFrom, switchMap } from 'rxjs';
import { map, shareReplay, startWith } from 'rxjs/operators';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { ClipboardModule, Clipboard } from '@angular/cdk/clipboard';
import { AuthService } from '../../services/auth.service';
import { WorkspaceService } from '../../services/workspace.service';
import { ChartComponent } from '../chart/chart.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { CommentDialogComponent } from '../comment-dialog/comment-dialog.component';
import { ChangeHistoryComponent } from '../change-history/change-history.component';
import { FooterComponent } from '../footer/footer.component';
import { Category, ChangeEvent, ChangeType, Workspace } from '../../models/counter.model';

@Component({
  selector: 'app-main',
  imports: [
    AsyncPipe,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatCheckboxModule,
    MatMenuModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    ClipboardModule,
    ChartComponent,
    ChangeHistoryComponent,
    FooterComponent,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly workspaceService = inject(WorkspaceService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly clipboard = inject(Clipboard);

  @ViewChild(ChartComponent) private chartComponent?: ChartComponent;

  showExampleHint = false;

  // ─── Undo ───────────────────────────────────────────────
  private lastUndoAction: { categoryId: string; action: 'increment' | 'decrement' | 'toggle' } | null = null;

  // ─── Inline edit ────────────────────────────────────────
  editMode = false;
  editingCategoryId: string | null = null;
  editingCategoryName = '';
  newInlineCategoryName = '';

  readonly workspace$ = this.route.paramMap.pipe(
    switchMap(params => this.workspaceService.getWorkspace(params.get('id')!))
  );

  readonly isOwner$ = combineLatest([this.workspace$, this.auth.user$]).pipe(
    map(([workspace, user]) => !!user && workspace?.ownerId === user.uid)
  );

  readonly canAccessSettings$ = combineLatest([this.workspace$, this.auth.user$]).pipe(
    map(([workspace, user]) => !!user && (
      workspace?.ownerId === user.uid ||
      (workspace?.admins ?? []).includes(user.uid)
    ))
  );

  readonly changes$ = this.route.paramMap.pipe(
    switchMap(params =>
      this.workspaceService.getChanges(params.get('id')!).pipe(startWith([] as ChangeEvent[]))
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  private get workspaceId(): string {
    return this.route.snapshot.paramMap.get('id')!;
  }

  // ─── Undo snackbar ──────────────────────────────────────

  private showUndoSnackbar(category: Category, action: 'increment' | 'decrement' | 'toggle'): void {
    this.lastUndoAction = { categoryId: category.id, action };
    const ref = this.snackBar.open(`${category.name} ändrad`, 'Ångra', { duration: 4000 });
    ref.onAction().subscribe(() => this.undoLastAction());
  }

  private async undoLastAction(): Promise<void> {
    if (!this.lastUndoAction) return;
    const { categoryId, action } = this.lastUndoAction;
    this.lastUndoAction = null;
    if (action === 'increment') {
      await this.workspaceService.decrement(this.workspaceId, categoryId);
    } else if (action === 'decrement') {
      await this.workspaceService.increment(this.workspaceId, categoryId);
    } else {
      await this.workspaceService.toggleCheck(this.workspaceId, categoryId);
    }
  }

  // ─── Counter / checkbox actions ─────────────────────────

  async increment(category: Category): Promise<void> {
    const prev = category.count;
    const next = prev + 1;
    await this.workspaceService.increment(this.workspaceId, category.id);
    await this.promptAndLog(category, 'increment', prev, next, `Räknaren ökas: ${prev} → ${next}`);
    this.showUndoSnackbar(category, 'increment');
  }

  async decrement(category: Category): Promise<void> {
    if (category.count === 0) return;
    const prev = category.count;
    const next = Math.max(0, prev - 1);
    await this.workspaceService.decrement(this.workspaceId, category.id);
    await this.promptAndLog(category, 'decrement', prev, next, `Räknaren minskas: ${prev} → ${next}`);
    this.showUndoSnackbar(category, 'decrement');
  }

  async toggleCheck(category: Category): Promise<void> {
    const willBeChecked = !(category.checked ?? false);
    await this.workspaceService.toggleCheck(this.workspaceId, category.id);
    await this.promptAndLog(
      category,
      willBeChecked ? 'toggle_on' : 'toggle_off',
      category.checked ?? false,
      willBeChecked,
      willBeChecked ? 'Markeras som klar' : 'Markeras som ej klar'
    );
    this.showUndoSnackbar(category, 'toggle');
  }

  // ─── Inline category management ─────────────────────────

  startInlineEdit(category: Category): void {
    this.editingCategoryId = category.id;
    this.editingCategoryName = category.name;
  }

  cancelInlineEdit(): void {
    this.editingCategoryId = null;
    this.editingCategoryName = '';
  }

  saveInlineEdit(categories: Category[]): void {
    const name = this.editingCategoryName.trim();
    if (!name || !this.editingCategoryId) return;
    const updated = categories.map(c =>
      c.id === this.editingCategoryId ? { ...c, name } : c
    );
    this.workspaceService.updateCategories(this.workspaceId, updated);
    this.editingCategoryId = null;
    this.editingCategoryName = '';
  }

  addInlineCategory(categories: Category[]): void {
    const name = this.newInlineCategoryName.trim();
    if (!name) return;
    const newCategory: Category = { id: crypto.randomUUID(), name, count: 0 };
    const updated = [...categories, newCategory];
    this.workspaceService.updateCategories(this.workspaceId, updated);
    this.newInlineCategoryName = '';
  }

  confirmDeleteInline(category: Category, categories: Category[]): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Ta bort kategori', message: `Ta bort "${category.name}"?` }
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      const updated = categories.filter(c => c.id !== category.id);
      this.workspaceService.updateCategories(this.workspaceId, updated);
    });
  }

  exitEditMode(): void {
    this.editMode = false;
    this.editingCategoryId = null;
    this.editingCategoryName = '';
    this.newInlineCategoryName = '';
  }

  // ─── Share link ─────────────────────────────────────────

  copyShareUrl(workspace: Workspace): void {
    if (workspace.isPublic) {
      this.clipboard.copy(`${window.location.origin}/view/${this.workspaceId}`);
      this.snackBar.open('Länk kopierad!', undefined, { duration: 2500 });
    } else {
      const ref = this.snackBar.open(
        'Aktivera delningslänk i inställningarna',
        'Inställningar',
        { duration: 4000 }
      );
      ref.onAction().subscribe(() => this.goToAdmin());
    }
  }

  // ─── Existing methods ────────────────────────────────────

  private async promptAndLog(
    category: Category,
    changeType: ChangeType,
    previousValue: number | boolean,
    newValue: number | boolean,
    changeDescription: string
  ): Promise<void> {
    const [user, workspace, changes] = await Promise.all([
      firstValueFrom(this.auth.user$),
      firstValueFrom(this.workspace$),
      firstValueFrom(this.changes$),
    ]);
    if (!user) return;

    let comment: string | null = null;

    if (workspace.enableComments) {
      const previousComments = [
        ...new Set(
          changes
            .filter(c => c.categoryId === category.id && c.comment)
            .map(c => c.comment!)
        ),
      ];
      comment = await firstValueFrom(
        this.dialog
          .open(CommentDialogComponent, {
            data: { categoryName: category.name, changeDescription, previousComments },
            width: '360px',
          })
          .afterClosed()
      ) ?? null;
    }

    try {
      await this.workspaceService.logChange(this.workspaceId, {
        workspaceId: this.workspaceId,
        categoryId: category.id,
        categoryName: category.name,
        changeType,
        previousValue,
        newValue,
        userId: user.uid,
        userEmail: user.email ?? '',
        ...(comment ? { comment } : {}),
      });
    } catch (e) {
      console.error('logChange failed:', e);
    }
  }

  async loadExample(workspace: Workspace): Promise<void> {
    const mode = workspace.mode ?? 'counter';
    const names = mode === 'counter'
      ? ['Kaffe', 'Möten', 'Pauser', 'Samtal']
      : ['Handla mat', 'Betala räkningar', 'Städa', 'Ring läkaren'];
    const categories: Category[] = names.map(name => ({ id: crypto.randomUUID(), name, count: 0 }));
    await this.workspaceService.updateCategories(this.workspaceId, categories);
    this.showExampleHint = false;
  }

  hasValues(workspace: Workspace): boolean {
    if ((workspace.mode ?? 'counter') === 'checkbox') {
      return workspace.categories.some(c => c.checked);
    }
    return workspace.categories.some(c => c.count > 0);
  }

  checkedCount(categories: Category[]): number {
    return categories.filter(c => c.checked).length;
  }

  progressPct(categories: Category[]): number {
    if (!categories.length) return 0;
    return Math.round(this.checkedCount(categories) / categories.length * 100);
  }

  progressMessage(categories: Category[]): string {
    const pct = this.progressPct(categories);
    if (pct === 0)  return 'Sätt igång! 🚀';
    if (pct < 25)   return 'Bra start! 👏';
    if (pct < 50)   return 'På god väg! 💪';
    if (pct === 50) return 'Halvvägs! 🌟';
    if (pct < 75)   return 'Mer än hälften klar! 💪';
    if (pct < 100)  return 'Nästan klar! 🔥';
    return 'Klart! Bra jobbat! 🎉';
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  goToAdmin(): void {
    this.router.navigate(['/workspace', this.workspaceId, 'admin']);
  }

  confirmReset(): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Nollställ', message: 'Vill du nollställa allt?' }
    }).afterClosed().subscribe(async confirmed => {
      if (!confirmed) return;
      const [workspace, user] = await Promise.all([
        firstValueFrom(this.workspace$),
        firstValueFrom(this.auth.user$),
      ]);
      if (!user) return;
      await this.workspaceService.reset(this.workspaceId, workspace.categories);
      const isCheckbox = (workspace.mode ?? 'counter') === 'checkbox';
      const affected = workspace.categories.filter(c =>
        isCheckbox ? (c.checked ?? false) : (c.count ?? 0) > 0
      );
      await Promise.all(affected.map(c =>
        this.workspaceService.logChange(this.workspaceId, {
          workspaceId: this.workspaceId,
          categoryId: c.id,
          categoryName: c.name,
          changeType: isCheckbox ? 'toggle_off' : 'decrement',
          previousValue: isCheckbox ? true : c.count,
          newValue: isCheckbox ? false : 0,
          userId: user.uid,
          userEmail: user.email ?? '',
          comment: 'Nollställd',
        })
      ));
    });
  }

  async exportPng(): Promise<void> {
    const workspace = await firstValueFrom(this.workspace$);
    const logo = await this.loadLogoImage();

    let sourceCanvas: HTMLCanvasElement;
    if ((workspace.mode ?? 'counter') === 'checkbox') {
      sourceCanvas = this.buildCheckboxCanvas(workspace, logo);
    } else {
      if (!this.chartComponent) return;
      const chartCanvas = this.chartComponent.getCanvas();
      const padding = 20;
      const footerH = 28;
      const tempCtx = document.createElement('canvas').getContext('2d')!;
      const notesH = workspace.notes
        ? this.drawNotesText(tempCtx, workspace.notes, 0, 0, chartCanvas.width, false) + 16
        : 0;
      sourceCanvas = document.createElement('canvas');
      sourceCanvas.width = chartCanvas.width + padding * 2;
      sourceCanvas.height = chartCanvas.height + padding * 2 + notesH + footerH;
      const ctx = sourceCanvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, sourceCanvas.width, sourceCanvas.height);
      ctx.drawImage(chartCanvas, padding, padding);
      if (workspace.notes) {
        ctx.fillStyle = '#757575';
        this.drawNotesText(ctx, workspace.notes, padding, chartCanvas.height + padding + 4, chartCanvas.width);
      }
      this.drawExportFooter(ctx, sourceCanvas.width, sourceCanvas.height - 8, logo);
    }

    const blob = await new Promise<Blob>((resolve, reject) =>
      sourceCanvas.toBlob(b => b ? resolve(b) : reject(new Error('Export misslyckades')), 'image/png')
    );

    const filename = `${workspace.title}.png`;
    const file = new File([blob], filename, { type: 'image/png' });

    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: workspace.title }); return; } catch { }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  private buildCheckboxCanvas(workspace: Workspace, logo: HTMLImageElement): HTMLCanvasElement {
    const W = 400;
    const PAD = 24;
    const ROW = 44;
    const BOX = 20;
    const TITLE_H = 76;
    const FOOTER_H = 40;
    const maxTextW = W - PAD * 2;

    const tempCtx = document.createElement('canvas').getContext('2d')!;
    const notesH = workspace.notes
      ? this.drawNotesText(tempCtx, workspace.notes, 0, 0, maxTextW, false) + 12
      : 0;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = PAD + TITLE_H + notesH + workspace.categories.length * ROW + FOOTER_H + PAD;

    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let y = PAD;

    // Title
    ctx.fillStyle = '#212121';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText(workspace.title, PAD, y + 20);

    // Progress line
    const checked = workspace.categories.filter(c => c.checked).length;
    const total = workspace.categories.length;
    const pct = total > 0 ? Math.round(checked / total * 100) : 0;
    ctx.fillStyle = '#757575';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(`${checked} av ${total} klara · ${pct}%`, PAD, y + 44);

    // Progress bar
    const barY = y + 56;
    const barW = W - PAD * 2;
    ctx.fillStyle = '#e0e0e0';
    this.roundRect(ctx, PAD, barY, barW, 6, 3);
    ctx.fill();
    if (pct > 0) {
      ctx.fillStyle = '#4caf50';
      this.roundRect(ctx, PAD, barY, barW * pct / 100, 6, 3);
      ctx.fill();
    }

    y += TITLE_H;

    // Notes
    if (workspace.notes) {
      ctx.fillStyle = '#757575';
      const drawnH = this.drawNotesText(ctx, workspace.notes, PAD, y, maxTextW);
      y += drawnH + 12;
    }

    // Category rows
    for (const cat of workspace.categories) {
      const boxY = y + (ROW - BOX) / 2;

      if (cat.checked) {
        ctx.fillStyle = '#4caf50';
        this.roundRect(ctx, PAD, boxY, BOX, BOX, 4);
        ctx.fill();
        // Checkmark
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(PAD + 4,      boxY + BOX / 2);
        ctx.lineTo(PAD + BOX / 2 - 1, boxY + BOX - 5);
        ctx.lineTo(PAD + BOX - 4, boxY + 5);
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#bdbdbd';
        ctx.lineWidth = 1.5;
        this.roundRect(ctx, PAD, boxY, BOX, BOX, 4);
        ctx.stroke();
      }

      // Category name (truncate if needed)
      ctx.font = '15px system-ui, sans-serif';
      ctx.fillStyle = cat.checked ? '#212121' : '#757575';
      const textX = PAD + BOX + 12;
      const maxW = W - textX - PAD;
      let name = cat.name;
      while (ctx.measureText(name).width > maxW && name.length > 1) {
        name = name.slice(0, -1);
      }
      if (name !== cat.name) name = name.slice(0, -1) + '…';
      ctx.fillText(name, textX, y + ROW / 2 + 5);

      // Row divider
      ctx.strokeStyle = '#f5f5f5';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAD, y + ROW);
      ctx.lineTo(W - PAD, y + ROW);
      ctx.stroke();

      y += ROW;
    }

    // Footer
    this.drawExportFooter(ctx, W, y + PAD + 12, logo);

    return canvas;
  }

  /**
   * Draws (or measures when draw=false) wrapped + newline-respecting notes text.
   * Returns total pixel height used.
   */
  private drawNotesText(
    ctx: CanvasRenderingContext2D,
    notes: string,
    x: number, y: number,
    maxWidth: number,
    draw = true
  ): number {
    const LINE_H = 17;
    ctx.font = '13px system-ui, sans-serif';
    let totalH = 0;
    for (const para of notes.split('\n')) {
      if (!para.trim()) { totalH += Math.round(LINE_H * 0.6); continue; }
      let line = '';
      for (const word of para.split(' ')) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && line) {
          if (draw) ctx.fillText(line, x, y + totalH + 13);
          totalH += LINE_H;
          line = word;
        } else {
          line = test;
        }
      }
      if (line) {
        if (draw) ctx.fillText(line, x, y + totalH + 13);
        totalH += LINE_H;
      }
    }
    return totalH;
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y,     x + w, y + r,     r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x,     y + h, x,     y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x,     y,     x + r, y,         r);
    ctx.closePath();
  }

  private loadLogoImage(): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = 'icons/icon-192x192.png';
    });
  }

  private drawExportFooter(ctx: CanvasRenderingContext2D, canvasWidth: number, y: number, logo: HTMLImageElement): void {
    const logoSize = 14;
    const gap = 5;
    const text = '© Koll på läget? · Durbacken Design';
    ctx.font = '11px system-ui, sans-serif';
    const textWidth = ctx.measureText(text).width;
    const totalWidth = logoSize + gap + textWidth;
    const startX = (canvasWidth - totalWidth) / 2;

    // Logo with rounded corners via clip
    ctx.save();
    const r = 3;
    ctx.beginPath();
    ctx.moveTo(startX + r, y - logoSize);
    ctx.lineTo(startX + logoSize - r, y - logoSize);
    ctx.arcTo(startX + logoSize, y - logoSize, startX + logoSize, y - logoSize + r, r);
    ctx.lineTo(startX + logoSize, y - r);
    ctx.arcTo(startX + logoSize, y, startX + logoSize - r, y, r);
    ctx.lineTo(startX + r, y);
    ctx.arcTo(startX, y, startX, y - r, r);
    ctx.lineTo(startX, y - logoSize + r);
    ctx.arcTo(startX, y - logoSize, startX + r, y - logoSize, r);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(logo, startX, y - logoSize, logoSize, logoSize);
    ctx.restore();

    ctx.fillStyle = '#bdbdbd';
    ctx.textAlign = 'left';
    ctx.fillText(text, startX + logoSize + gap, y - 1);
  }

  async exportXls(): Promise<void> {
    const [workspace, changes] = await Promise.all([
      firstValueFrom(this.workspace$),
      firstValueFrom(this.changes$),
    ]);

    const rows = [...changes].reverse().map(c => {
      const date = c.timestamp?.toDate?.() ?? new Date();
      return {
        'Datum':      date.toLocaleDateString('sv-SE'),
        'Tid':        date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }),
        'Användare':  c.userEmail,
        'Kategori':   c.categoryName,
        'Ändring':    this.describeChange(c),
        'Kommentar':  c.comment ?? '',
      };
    });

    const { utils, writeFile } = await import('xlsx');

    // Build header rows: title + optional notes lines + blank separator
    const headerAoa: string[][] = [[workspace.title]];
    if (workspace.notes) {
      workspace.notes.split('\n').forEach(line => headerAoa.push([line]));
    }
    headerAoa.push([]); // blank row before data

    const sheet = utils.aoa_to_sheet(headerAoa);
    utils.sheet_add_json(sheet, rows, { origin: { r: headerAoa.length, c: 0 } });

    const wb = utils.book_new();
    utils.book_append_sheet(wb, sheet, 'Historik');
    writeFile(wb, `${workspace.title}-historik.xlsx`);
  }

  private describeChange(change: ChangeEvent): string {
    switch (change.changeType as ChangeType) {
      case 'increment': return `${change.previousValue} → ${change.newValue}`;
      case 'decrement': return `${change.previousValue} → ${change.newValue}`;
      case 'toggle_on':  return 'Avbockad → Ikryssad';
      case 'toggle_off': return 'Ikryssad → Avbockad';
    }
  }
}
