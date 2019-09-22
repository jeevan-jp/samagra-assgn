const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const values = require('./values');

exports.pdf = (req, res) => {
  const SCOPES = ['https://www.googleapis.com/auth/documents.readonly'];
  const TOKEN_PATH = 'token.json';
  
  fs.readFile('credentials.json', (err, content) => {
    // if (err) return console.log('Error loading client secret file:', err);
    if (err) res.status(500).send(err);
    authorize(JSON.parse(content), generatePDF);
  });
  
  function authorize(credentials, callback) {
    // console.log(credentials);
    const { client_secret, client_id, redirect_uris } = credentials;
    const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);
  
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return getNewToken(oAuth2Client, callback);
      oAuth2Client.setCredentials(JSON.parse(token));
      callback(oAuth2Client);
    });
  }
  
  function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        // if (err) return console.error('Error retrieving access token', err);
        if (err) res.status(500).send(err);
        oAuth2Client.setCredentials(token);
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) res.status(500).send(err);
          // if (err) console.error(err);
          // console.log('Token stored to', TOKEN_PATH);
        });
        callback(oAuth2Client);
      });
    });
  }
  
  function generatePDF(auth) {
    const docs = google.docs({ version: 'v1', auth });
    docs.documents.get({
      documentId: '1Sly_M_2N4IMZIMmrckki0CZTmxmpaiWCQdNkJHyT5zY',
    }, (err, docData) => {
      if (err) res.status(500).send(err);
  
      // const arr = [];
      let document = docData.data;
  
      if (Boolean(document.body) && document.body.content) {
        const bodyContent = document.body.content;
        bodyContent.forEach(contentBody => {
          const paragraph = contentBody.paragraph;
          const table = contentBody.table;
          if (paragraph && paragraph.elements) {
            const elements = paragraph.elements;
            elements.forEach(elem => {
              if (elem.textRun && elem.textRun.content) {
                const content = elem.textRun.content;
                if (/{{[0-9]/.test(content)) {
                  const newStr = replacer(content);
                  if(newStr) {
                    elem.textRun.content = newStr;
                    // arr.push(newStr);
                  }
                }
              }
            })
          }
  
          if (table && table.tableRows) {
            const tableRows = table.tableRows;
            tableRows.forEach(tr => {
              const tableCells = tr.tableCells;
              if (tableCells) {
                tableCells.forEach(tCell => {
                  if (tCell.content) {
                    const tCellContent = tCell.content;
                    tCellContent.forEach(tcContent => {
                      const tcPara = tcContent.paragraph;
                      if (tcPara && tcPara.elements) {
                        const tcParaElement = tcPara.elements;
                        tcParaElement.forEach(tElem => {
                          if (tElem.textRun && tElem.textRun.content) {
                            const tElemContent = tElem.textRun.content;
                            if (/{{[0-9]/.test(tElemContent)) {
                              newStr = replacer(tElemContent);
                              if(newStr) {
                                tElem.textRun.content = newStr;
                                // arr.push(newStr);
                              }
                            }
                          }
                        })
                      }
                    })
                  }
                })
              }
            })
          }
  
          function replacer(content) {
            const index = content.indexOf('{{');
            const index1 = index + 2, index2 = index + 3;
            let newStr = '';
  
            if(!isNaN(content[index1])) {
              if(!isNaN(content[index2])) {
                const num = parseInt((content[index1] + content[index2]), 10);
                newStr = content.replace(/{{[0-9][0-9]}}/, values[num] || values[39]);
              } else {
                const num = parseInt(content[index1], 10);
                newStr = content.replace(/{{[0-9]}}/, values[num] || values[39]);
              }
            }
  
            // arr.push(newStr);
            return newStr;
          }
        })
      }
      res.status(200).send(document);
    });
  }
}




// const fs = require('fs');
// const express = require('express');
// const readline = require('readline');
// const { google } = require('googleapis');
// const bodyParser = require('body-parser');
// const values = require('./values');

// const router = express.Router();
// const app = express();

// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());

// router.use('/', (req, res) => {
//   const SCOPES = ['https://www.googleapis.com/auth/documents.readonly'];
//   const TOKEN_PATH = 'token.json';

//   fs.readFile('credentials.json', (err, content) => {
//     // if (err) return console.log('Error loading client secret file:', err);
//     if (err) res.status(500).send(err);
//     authorize(JSON.parse(content), printDocTitle);
//   });

//   function authorize(credentials, callback) {
//     // console.log(credentials);
//     const { client_secret, client_id, redirect_uris } = credentials;
//     const oAuth2Client = new google.auth.OAuth2(
//       client_id, client_secret, redirect_uris[0]);

//     fs.readFile(TOKEN_PATH, (err, token) => {
//       if (err) return getNewToken(oAuth2Client, callback);
//       oAuth2Client.setCredentials(JSON.parse(token));
//       callback(oAuth2Client);
//     });
//   }

//   function getNewToken(oAuth2Client, callback) {
//     const authUrl = oAuth2Client.generateAuthUrl({
//       access_type: 'offline',
//       scope: SCOPES,
//     });
//     console.log('Authorize this app by visiting this url:', authUrl);
//     const rl = readline.createInterface({
//       input: process.stdin,
//       output: process.stdout,
//     });
//     rl.question('Enter the code from that page here: ', (code) => {
//       rl.close();
//       oAuth2Client.getToken(code, (err, token) => {
//         // if (err) return console.error('Error retrieving access token', err);
//         if (err) res.status(500).send(err);
//         oAuth2Client.setCredentials(token);
//         fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
//           if (err) res.status(500).send(err);
//           // if (err) console.error(err);
//           // console.log('Token stored to', TOKEN_PATH);
//         });
//         callback(oAuth2Client);
//       });
//     });
//   }

//   function printDocTitle(auth) {
//     const docs = google.docs({ version: 'v1', auth });
//     docs.documents.get({
//       documentId: '1Sly_M_2N4IMZIMmrckki0CZTmxmpaiWCQdNkJHyT5zY',
//     }, (err, docData) => {
//       if (err) res.status(500).send(err);

//       // const arr = [];
//       let document = docData.data;

//       if (Boolean(document.body) && document.body.content) {
//         const bodyContent = document.body.content;
//         bodyContent.forEach(contentBody => {
//           const paragraph = contentBody.paragraph;
//           const table = contentBody.table;
//           if (paragraph && paragraph.elements) {
//             const elements = paragraph.elements;
//             elements.forEach(elem => {
//               if (elem.textRun && elem.textRun.content) {
//                 const content = elem.textRun.content;
//                 if (/{{[0-9]/.test(content)) {
//                   const newStr = replacer(content);
//                   if(newStr) {
//                     elem.textRun.content = newStr;
//                     // arr.push(newStr);
//                   }
//                 }
//               }
//             })
//           }

//           if (table && table.tableRows) {
//             const tableRows = table.tableRows;
//             tableRows.forEach(tr => {
//               const tableCells = tr.tableCells;
//               if (tableCells) {
//                 tableCells.forEach(tCell => {
//                   if (tCell.content) {
//                     const tCellContent = tCell.content;
//                     tCellContent.forEach(tcContent => {
//                       const tcPara = tcContent.paragraph;
//                       if (tcPara && tcPara.elements) {
//                         const tcParaElement = tcPara.elements;
//                         tcParaElement.forEach(tElem => {
//                           if (tElem.textRun && tElem.textRun.content) {
//                             const tElemContent = tElem.textRun.content;
//                             if (/{{[0-9]/.test(tElemContent)) {
//                               newStr = replacer(tElemContent);
//                               if(newStr) {
//                                 tElem.textRun.content = newStr;
//                                 // arr.push(newStr);
//                               }
//                             }
//                           }
//                         })
//                       }
//                     })
//                   }
//                 })
//               }
//             })
//           }

//           function replacer(content) {
//             const index = content.indexOf('{{');
//             const index1 = index + 2, index2 = index + 3;
//             let newStr = '';

//             if(!isNaN(content[index1])) {
//               if(!isNaN(content[index2])) {
//                 const num = parseInt((content[index1] + content[index2]), 10);
//                 newStr = content.replace(/{{[0-9][0-9]}}/, values[num] || values[39]);
//               } else {
//                 const num = parseInt(content[index1], 10);
//                 newStr = content.replace(/{{[0-9]}}/, values[num] || values[39]);
//               }
//             }

//             // arr.push(newStr);
//             return newStr;
//           }
//         })
//       }
//       res.status(200).send(document);
//     });
//   }
// });

// app.use(router);

// app.use(function (err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get("env") === "development" ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.json({ error: err });
// });

// const port = process.env.PORT || 3000;
// app.listen(port, () => console.log(`Listening on port ${port}`));