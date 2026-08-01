import { Injectable } from "@nestjs/common";
import { EmailService } from "../../aplication/ports/email";
import * as nodemailer from "nodemailer";
import { TemplateEngine } from "./templete-engine";

@Injectable()
export class NodemailerEmailService implements EmailService {

    private readonly transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    async enviarRecuperacionContrasena(correo: string, token: string): Promise<void> {

     const html = await TemplateEngine.render("recuperacion-constrasena.html", {
        codigo: token,
        minutos: "15",
    });;

     await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: correo,
        subject: "Recuperación de contraseña",
        html,
     });
    }
}