import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.sass']
})
export class LoginComponent implements OnInit {

  constructor(
    public auth: AuthService
    ) { }

  ngOnInit(): void {
    console.log(this.callbackUrl);
  }

  callbackUrl = environment.callbackUrl

  mail: string = ''
  password: string = ''

}
