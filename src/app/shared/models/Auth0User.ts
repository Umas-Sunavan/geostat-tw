import { Gui3dSettings } from "./GuiColumnSettings"

export interface Auth0User {
  "created_at": string,
  "email": string,
  "email_verified": boolean,
  "identities": [
    {
      "user_id": string,
      "provider": string,
      "connection": string,
      "isSocial": boolean
    }
  ],
  "name": string,
  "nickname": string,
  "picture": string,
  "updated_at": string,
  "user_id": string,
  "username": string,
  "last_password_reset": string,
  "user_metadata": {
    "theme": string
  },
  "last_ip": string,
  "last_login": string,
  "logins_count": number
}