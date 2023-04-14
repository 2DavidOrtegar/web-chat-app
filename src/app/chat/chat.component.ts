import {Component, OnInit} from '@angular/core';

import { Client } from "@stomp/stompjs";
import * as SockJS from "sockjs-client";
import {Mensaje} from "./models/mensaje";

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})

export class ChatComponent implements OnInit{

  private client: any;
  conectado: boolean = false;
  mensaje: Mensaje = new Mensaje();
  mensajes: Mensaje[] = [];
  constructor() {
  }

  ngOnInit() {
    this.client = new Client();
    this.client.webSocketFactory = ()=> {
      return new SockJS("http://localhost:8080/chat-websocket");
    }

    this.client.onConnect = (frame:any) => {
      console.log('Conectados: '+ this.client.connected + ' : ' + frame);
      this.conectado=true;

      this.client.subscribe('/chat/mensaje', (e:any)=>{
        let mensaje: Mensaje = JSON.parse(e.body) as Mensaje;
        mensaje .fecha = new Date(mensaje.fecha);

        if (!this.mensaje.color &&
          mensaje.tipo == 'NUEVO_USUARIO' &&
          this.mensaje.username==mensaje.username) {
          this.mensaje.color = mensaje.color;
        }

        this.mensajes.push(mensaje);
        console.log("Objeto mensaje: "+ JSON.stringify(mensaje));
      });

      this.mensaje.tipo='NUEVO_USUARIO';
      this.client.publish({destination: '/app/mensaje', body: JSON.stringify(this.mensaje)})
    }

    this.client.onDisconnect = (frame:any) => {
      console.log('Desconectados: '+ !this.client.connected + ' : ' + frame);
      this.conectado=false;
    }
  }

  conectar(): void{
    this.client.activate();
  }

  desconectar(): void{
    this.client.deactivate();
  }

  enviarMensaje(): void{
    this.mensaje.tipo='MENSAJE';
    this.client.publish({destination: '/app/mensaje', body: JSON.stringify(this.mensaje)})
    this.mensaje.texto='';
  }
}
