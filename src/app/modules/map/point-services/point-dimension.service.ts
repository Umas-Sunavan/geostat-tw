import { Injectable } from '@angular/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore/lite';
import { getDatabase, ref, onValue, Database, push } from "firebase/database";
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PointDimensionService {

  constructor() {
    this.firebaseConfig = environment.firebaseConfig
    this.dataBase = this.initFirebase()
  }

  firebaseConfig
  dataBase: Database

  initFirebase = () => {
    const firebaseApp = initializeApp(this.firebaseConfig);
    const database = getDatabase(firebaseApp);
    return database
  }

  loadDimensions = () => {
    const starCountRef = ref(this.dataBase, '/pointTables');
    return new Observable(subscribe => {
      onValue(starCountRef, (snapshot) => {
        const data = snapshot.val();
        subscribe.next(data)
      });
    })
  }

  writeUserData = () => {
    push(ref(this.dataBase, '/pointTables'), {
      tableName: 'tableName',
      tableCreator: 'tableCreator',
      tableCreateDate: 'tableCreateDate',
      tableSource: 'url',
      deleted: true,
      options: {
        colors: {
          mainColor: '#ff00ff'
        },
        radius: 2,
        columnHeight: 1.5,
        focusOnPoint: { x: 0, y: 0, z: 0},
        cameraPosition: { x: 0, y: 0, z: 0},
        connectMode: 'triangle',
        connectedPoints: [1,2,4]
      }
    })
  }

}
