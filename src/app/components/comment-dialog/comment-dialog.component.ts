import { Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface CommentDialogData {
  categoryName: string;
  changeDescription: string;
  previousComments: string[];
}

@Component({
  selector: 'app-comment-dialog',
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.categoryName }}</h2>
    <mat-dialog-content>
      <p class="change-desc">{{ data.changeDescription }}</p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Kommentar (valfritt)</mat-label>
        <input matInput
               [formControl]="commentControl"
               [matAutocomplete]="auto"
               placeholder="Varför gjordes denna ändring?" />
        <mat-autocomplete #auto="matAutocomplete">
          @for (option of filteredComments$ | async; track option) {
            <mat-option [value]="option">{{ option }}</mat-option>
          }
        </mat-autocomplete>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="skip()">Hoppa över</button>
      <button mat-flat-button color="primary" (click)="save()">Spara</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .change-desc { color: var(--text-secondary); font-size: 14px; margin: 0 0 16px; }
    .full-width { width: 100%; }
    mat-dialog-content { min-width: 280px; }
  `]
})
export class CommentDialogComponent implements OnInit {
  readonly data = inject<CommentDialogData>(MAT_DIALOG_DATA);
  readonly ref = inject(MatDialogRef<CommentDialogComponent>);

  readonly commentControl = new FormControl('');
  filteredComments$!: Observable<string[]>;

  ngOnInit(): void {
    this.filteredComments$ = this.commentControl.valueChanges.pipe(
      map(value => {
        const lower = (value ?? '').toLowerCase().trim();
        if (!lower) return [];
        return this.data.previousComments.filter(c => c.toLowerCase().includes(lower));
      })
    );
  }

  skip(): void {
    this.ref.close(null);
  }

  save(): void {
    const comment = this.commentControl.value?.trim() ?? '';
    this.ref.close(comment || null);
  }
}
