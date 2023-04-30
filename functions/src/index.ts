import * as functions from "firebase-functions";
import * as firebaseAdmin from "firebase-admin";
import { getVallibelFinanceFDRates } from "./scrapers/fixed-deposit-rates/Vallibel";
import { emailService } from "./services/EmailService";
import { makeFixedLengthString } from "./utils/string-utils";

// Firebase Admin SDK Initialization
firebaseAdmin.initializeApp(functions.config().firebase);

export const fdRates = {
    "vallibelFinance": functions.runWith({
        memory: "1GB",
        timeoutSeconds: 300,
    }).https.onRequest(async (req, res) => {

        const tableData = await getVallibelFinanceFDRates();
        res.status(200).send({
            message: "OK",
            data: tableData
        });

        const db = firebaseAdmin.firestore();
        const date = new Date();
        await db.collection("fdRates").doc(date.toISOString().split("T")[0]).set({ vallibelFinance: tableData }, { merge: true });

        // Get All Subscribers For Emails
        const docs = await db.collection("subscribers").where("topic", "==", "FD_RATES").where("firm", "==", "VallibelFinance").get();
        const subscribers = docs.docs.map(doc => {
            return {
                Email: doc.data().email,
                Name: doc.data().name
            }
        });

        // Process Data
        let formattedFDRatesList = "";
        const prevDate = new Date();
        prevDate.setDate(prevDate.getDate() - 1)
        const prevDayDocId = prevDate.toISOString().split("T")[0];
        const prevDayDoc = await db.collection("fdRates").doc(prevDayDocId).get();

        if (prevDayDoc.exists) {

            const prevDayFDRates = prevDayDoc.data();
            const prevDayRatesOfVallibel = prevDayFDRates?.vallibelFinance;

            if (prevDayRatesOfVallibel) {

                for (let i = 0; i < tableData.length; i++) {
                    const today = tableData[i];
                    const yesterday = prevDayRatesOfVallibel[i];
                    let dataString = `${makeFixedLengthString(today.period.split(" ")[0], 2)} ${today.period.split(" ")[1]} => Matuarity: ${makeFixedLengthString(today.matuarityRate.toString(), 6)} (${yesterday.matuarityRate.toString()}) | `;

                    if (today.matuarityRate > yesterday.matuarityRate) {
                        dataString += "INC";
                    } else if (today.matuarityRate < yesterday.matuarityRate) {
                        dataString += "DEC";
                    } else {
                        dataString += "N/C";
                    }

                    formattedFDRatesList += `${dataString}\n`;
                }
            }
        }


        // Create Message
        const emailMessage = {
            From: {
                Email: 'davizdev@gmail.com',
                Name: 'DaViz',
            },
            To: subscribers,
            Subject: 'Ayubowan! From DaViz',
            TextPart: `FD Rates of Vallibel Finance on ${date.toISOString().split("T")[0]} \n\n${formattedFDRatesList}`,
            // HTMLPart: '<table>  <td>Alfreds Futterkiste</td> <td>Maria Anders</td> <td>Germany</td> </tr> <tr> <td>Centro comercial Moctezuma</td> <td>Francisco Chang</td> <td>Mexico</td> </tr> </table>',
        }

        // Send Email
        console.log(">>>> LOG:", "Sending Emails to Subscribers...", { subscribers });
        await emailService.sendMail([emailMessage]);
        console.log(">>>> LOG:", "Emails sent :)");

        return;
    })

}

// export const email = functions.https.onRequest(async (request, response) => {

    // const createHTMLTable = (tableRows: any[]) => {


    //     return "<table>  <td>Alfreds Futterkiste</td> <td>Maria Anders</td> <td>Germany</td> </tr> <tr> <td>Centro comercial Moctezuma</td> <td>Francisco Chang</td> <td>Mexico</td> </tr> </table>"
    // }

    // emailService.sendMail([{
    //     From: {
    //         Email: 'davizdev@gmail.com',
    //         Name: 'DaViz',
    //     },
    //     To: [
    //         {
    //             Email: 'pasindudewapriya96@gmail.com',
    //             Name: 'Pasindu',
    //         },
    //     ],
    //     Subject: 'Ayubowan! From DaViz',
    //     TextPart: 'FD Rates of Vallibel Finance',
    //     HTMLPart: '<table>  <td>Alfreds Futterkiste</td> <td>Maria Anders</td> <td>Germany</td> </tr> <tr> <td>Centro comercial Moctezuma</td> <td>Francisco Chang</td> <td>Mexico</td> </tr> </table>',
    // },
    // ])

    // try {
    //     await sendMail();
    // } catch (error) {
    //     console.log(error);

    // }
    // const transporter = nodemailer.createTransport({
    //     service: 'gmail',
    //     host: 'smtp.gmail.com',
    //     port: 465,
    //     secure: true,
    //     auth: {
    //         user: 'davisdev@gmail.com',
    //         pass: 'placcezcjjohglpx'
    //     }
    // });

    // const mailOptions = {
    //     from: `davisdev@gmail.com`,
    //     to: "pasindudewapriya96@gmail.com",
    //     subject: 'contact form message',
    //     html: `<h1>Order Confirmation</h1>`
    // };

    // transporter.sendMail(mailOptions, (error: any, data: any) => {
    //     if (error) {
    //         console.log(error)
    //         return
    //     }
    //     response.send();

    // });

// })

// export const onWriteFDRates = functions.firestore.document("fdRates/{docId}").onWrite((change, context) => {

//     const transporter = nodemailer.createTransport({
//         service: 'gmail',
//         host: 'smtp.gmail.com',
//         port: 465,
//         secure: true,
//         auth: {
//             user: 'davisdev@gmail.com',
//             pass: 'wquusvidcltenpli'
//         }
//     });

//     console.log(context.eventType);

// });
