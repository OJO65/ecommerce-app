import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, map, take } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const expectedRole = route.data['role'];

    return this.authService.currentUser$.pipe(
      take(1),
      map((user) => {
        if (!user) {
          this.router.navigate(['/auth/login']);
          return false;
        }

        if (user.role === expectedRole) {
          return true;
        } else {
          if (user.role === 'admin') {
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.router.navigate(['/']);
          }
          return false;
        }
      })
    );
  }

}