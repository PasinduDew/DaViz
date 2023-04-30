const mailjet = require('node-mailjet');

interface EmailMessage {
    From: { Email: string, Name: string },
    To: Array<{ Email: string, Name: string }>,
    Subject: string,
    TextPart: string, HTMLPart?: string

}

class EmailService {

    private API_KEY: string = "75c5279f1aa2e0a9d29217984cbcedf1";
    private API_SECRET: string = "abf18f96dd1c8336b6384535b9ba162c";
    private transporter: any;

    constructor() {
        this.transporter = mailjet.apiConnect(this.API_KEY, this.API_SECRET);
    };

    async sendMail(messages: EmailMessage[]): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.transporter) {
                this.transporter.post('send', { version: 'v3.1' }).request({ Messages: messages })
                    .then((res: any) => {
                        resolve(res);
                    }).catch((err: any) => {
                        reject(err)
                    });
            }
        })
    }
}

export const emailService = new EmailService();