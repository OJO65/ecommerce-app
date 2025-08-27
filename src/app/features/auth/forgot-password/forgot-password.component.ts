import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-forgot-password',
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  emailSent = false;

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService, 
    private router: Router
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  async onSubmit() {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      try {
        const { email } = this.forgotPasswordForm.value;
        await this.authService.resetPassword(email);
        
        this.emailSent = true;
        this.successMessage = `Password reset email sent to ${email}. Please check your inbox and follow the instructions to reset your password.`;
        
        // Optionally, navigate back to login after a delay
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 5000);
        
      } catch (error: any) {
        this.errorMessage = this.getErrorMessage(error);
      } finally {
        this.isLoading = false;
      }
    }
  }

  goBackToLogin() {
    this.router.navigate(['/login']);
  }

  resendEmail() {
    if (this.forgotPasswordForm.valid) {
      this.onSubmit();
    }
  }

  private getErrorMessage(error: any): string {
    if (error.message) {
      return error.message;
    }

    switch (error.code) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/too-many-requests':
        return 'Too many requests. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection and try again.';
      default:
        return 'An error occurred while sending the reset email. Please try again.';
    }
  }
}
