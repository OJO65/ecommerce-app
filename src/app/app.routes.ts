import { Routes } from '@angular/router';
import { LoginComponent } from './core/features/auth/login/login.component';
import { RegisterComponent } from './core/features/auth/register/register.component';
import { ForgotPasswordComponent } from './core/features/auth/forgot-password/forgot-password.component';


export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'forgot-password', component: ForgotPasswordComponent }
];
