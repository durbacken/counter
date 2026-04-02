import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-about-page',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, MatDividerModule, FooterComponent],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.scss'
})
export class AboutPageComponent {
  private readonly router = inject(Router);
  goBack(): void { this.router.navigate(['/']); }
}
