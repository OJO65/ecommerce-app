import { Component, signal } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { HeaderComponent } from "./components/header/header.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('e-kabanda');
  constructor(private router: Router) {}

  isAuthPage(): boolean {
    const authPages = ['/login', 'register', 'forgot-password'];
    return authPages.includes(this.router.url);
  }
}
