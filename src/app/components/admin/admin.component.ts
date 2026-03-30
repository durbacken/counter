import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CounterStateService } from '../../services/counter-state.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { Category, CounterData } from '../../models/counter.model';

@Component({
  selector: 'app-admin',
  imports: [
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  private readonly stateService = inject(CounterStateService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackbar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  // Local snapshot updated from the state service
  data: CounterData = { title: '', categories: [] };

  // Form fields
  titleInput = '';
  newCategoryName = '';

  // Inline edit state
  editingId: string | null = null;
  editingName = '';

  ngOnInit(): void {
    this.stateService.data$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        this.data = data;
        // Initialise title input once (don't overwrite while user is typing)
        if (!this.titleInput) {
          this.titleInput = data.title;
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  saveTitle(): void {
    const title = this.titleInput.trim();
    if (title) {
      this.stateService.updateTitle(title);
    } else {
      // Restore previous value if field was cleared
      this.titleInput = this.data.title;
    }
  }

  startEdit(category: Category): void {
    this.editingId = category.id;
    this.editingName = category.name;
  }

  saveEdit(): void {
    const name = this.editingName.trim();

    if (!name) {
      this.showError('Namnet får inte vara tomt.');
      return;
    }

    const duplicate = this.data.categories.some(
      c => c.name.toLowerCase() === name.toLowerCase() && c.id !== this.editingId
    );
    if (duplicate) {
      this.showError('Det finns redan en kategori med det namnet.');
      return;
    }

    this.stateService.updateCategoryName(this.editingId!, name);
    this.editingId = null;
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  addCategory(): void {
    const name = this.newCategoryName.trim();
    if (!name) return;

    const duplicate = this.data.categories.some(
      c => c.name.toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      this.showError('Det finns redan en kategori med det namnet.');
      return;
    }

    this.stateService.addCategory(name);
    this.newCategoryName = '';
  }

  confirmDelete(category: Category): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Ta bort kategori',
        message: `Vill du ta bort "${category.name}"?`
      }
    }).afterClosed().subscribe(confirmed => {
      if (confirmed) this.stateService.deleteCategory(category.id);
    });
  }

  private showError(message: string): void {
    this.snackbar.open(message, 'Stäng', { duration: 3000 });
  }
}
