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
  escribiendo: string = '';
  clienteID: string = '';
  constructor() {
    this.clienteID = 'id-'+new Date().getUTCMilliseconds() + '-' + Math.random().toString(36).substring(2);
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

      //Mensaje escribiendo
      this.client.subscribe('/chat/escribiendo', (e:any)=>{
        this.escribiendo = e.body;
        setTimeout(() => this.escribiendo='', 3000);

      });


      //Historial
      console.log("ID cliente: "+this.clienteID)
      this.client.subscribe('/chat/historial/'+this.clienteID, (e:any)=>{
        const historial = JSON.parse(e.body) as Mensaje[];
        this.mensajes=historial.map(m =>{
          m.fecha = new Date(m.fecha);
          return m;
          }).reverse();
      });

      this.client.publish({destination: '/app/historial', body: this.clienteID});


      this.mensaje.tipo='NUEVO_USUARIO';
      this.client.publish({destination: '/app/mensaje', body: JSON.stringify(this.mensaje)})
    }

    this.client.onDisconnect = (frame:any) => {
      console.log('Desconectados: '+ !this.client.connected + ' : ' + frame);
      this.conectado=false;
      this.mensaje = new Mensaje();
      this.mensajes = [];
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

  escribiendoEvento(): void{
    this.client.publish({destination: '/app/escribiendo', body: this.mensaje.username});

  }
}
