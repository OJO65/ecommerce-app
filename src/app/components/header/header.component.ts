import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    RouterLink,
    MatBadgeModule,
    MatSidenavModule,
    MatListModule,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  @ViewChild('drawer') drawer!: MatSidenav;

  isLoggedIn = false;
  username: string | null = null;
  cartCount = 0;
  isMobile = false;
  sidebarOpen = false;
  accountDropdownOpen = false;

  private breakpointObserver = inject(BreakpointObserver);
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit() {
    // Existing auth and cart subscriptions
    this.authService.user$.subscribe((user) => {
      this.isLoggedIn = !!user;
      this.username = user ? user.displayName || user.email?.split('@')[0] : null;
    });

    this.cartService.cart$.subscribe((cart) => {
      this.cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    });

    // New responsive functionality
    this.breakpointObserver
      .observe(['(max-width: 918px)'])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile = result.matches;
        // Close sidebar when switching to desktop
        if (!this.isMobile && this.sidebarOpen) {
          this.closeSidebar();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
    if (this.drawer) {
      this.drawer.close();
    }
  }

  logout() {
    this.authService.logout().then(() => {
      this.router.navigate(['/login']);
      // Close sidebar if open when logging out
      this.closeSidebar();
    });
  }

  
toggleAccountDropdown() {
  this.accountDropdownOpen = !this.accountDropdownOpen;
}

closeAccountDropdown() {
  this.accountDropdownOpen = false;
}
}