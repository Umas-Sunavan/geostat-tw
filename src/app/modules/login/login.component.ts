import { Component, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.sass']
})
export class LoginComponent implements OnInit {

  constructor(
    public auth: AuthService) { }

  ngOnInit(): void {
    console.log(window.origin);
  }

  callbackUrl = environment.callbackUrl

  mail: string = ''
  password: string = ''

}
