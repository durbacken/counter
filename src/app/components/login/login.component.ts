import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  loading = false;
  error = '';

  async signIn(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      await this.auth.signInWithGoogle();
    } catch {
      this.error = 'Inloggningen misslyckades. Försök igen.';
      this.loading = false;
    }
  }
}
