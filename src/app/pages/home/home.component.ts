import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  imports: [RouterModule],
  styleUrls: ['./home.component.css']
})
export class HomeComponent  {
heroTitle = 'Welcome to e-kibanda';
heroSubtitle = 'Discover amazing products at unbeatable prices.';
heroImage = 'undraw_web-shopping_xd5k.svg';

}
