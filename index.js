const { DisconnectReason, useSingleFileAuthState } = require('@adiwajshing/baileys')
const makeWASocket = require('@adiwajshing/baileys').default

const fetch = require('cross-fetch')
const fs = require('fs');

const express = require('express')
var QRCode = require('qrcode')

const port = process.env.PORT || 3000

const app = express()
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let meuNumero = ''
let baileysQR = '';
let baileysBot;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function connectToWhatsApp() {
  const { state, saveState } = useSingleFileAuthState('./auth_info_multi.json')

  baileysBot = makeWASocket({
    printQRInTerminal: false,
    auth: state,
  })

  baileysBot.ev.on('creds.update', saveState)
  baileysBot.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update

    if (update.qr != undefined && update.qr != null) {
      baileysQR = update.qr
    } else {
      baileysQR = ''
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut
      if (shouldReconnect) {
        console.log('tentando reconectar')
        connectToWhatsApp()
      }
    } else if (connection === 'open') {
      console.log('conexão aberta')
    }
  })

  baileysBot.ev.on('messages.upsert', async (body) => {
    let mensagem = ''

    console.log(`Meu número: ${meuNumero}`)
    if (body.messages[0].key.remoteJisd == `${meuNumero}@s.whatsapp.net`) {
      console.log('mensagem enviada por mim 1...');
    } if (body.messages[0].key.fromMe == true) {
      console.log('mensagem enviada por mim 2...');
    } else {
      console.log(JSON.stringify(body.messages[0]));
      console.log(JSON.stringify(body.messages[0].message));
      if (body.messages[0].message != null && body.messages[0].message != undefined) {
        if (body.messages[0].message.audioMessage != null && body.messages[0].message.audioMessage != undefined) {
          console.log('mensagem de audio...');
          mensagem = 'gatilho-audio';
        } else if (body.messages[0].message.imageMessage != null && body.messages[0].message.imageMessage != undefined) {
          console.log('mensagem de imagem...');
          mensagem = 'gatilho-imagem';
        } else if (body.messages[0].message.videoMessage != null && body.messages[0].message.videoMessage != undefined) {
          console.log('mensagem de video...');
          mensagem = 'gatilho-video';
        } else if (body.messages[0].message.documentMessage != null && body.messages[0].message.documentMessage != undefined) {
          console.log('mensagem de dodcumento...');
          mensagem = 'gatilho-documento';
        } else if (body.messages[0].message.documentWithCaptionMessage != null && body.messages[0].message.documentWithCaptionMessage != undefined) {
          console.log('mensagem de dodcumento com legenda...');
          mensagem = 'gatilho-documento-legenda';
        } else if (body.messages[0].message.viewOnceMessage != null && body.messages[0].message.viewOnceMessage != undefined) {
          console.log('mensagem de visualizacao unica 1...');
          mensagem = 'gatilho-unica-1';
        } else if (body.messages[0].message.viewOnceMessageV2 != null && body.messages[0].message.viewOnceMessageV2 != undefined) {
          console.log('mensagem de visualizacao unica 2...');
          mensagem = 'gatilho-unica-2';
        } else if (body.messages[0].message.contactMessage != null && body.messages[0].message.contactMessage != undefined) {
          console.log('mensagem de contato...');
          mensagem = 'gatilho-contato';
        } else if ((body.messages[0].message.conversation != null || body.messages[0].message.conversation == undefined) && body.messages[0].message.conversation != '') {
          console.log('mensagem de texto...');
          mensagem = body.messages[0].message.conversation;
        } else if (body.messages[0].message.buttonsResponseMessage != null || body.messages[0].message.buttonsResponseMessage != undefined) {
          console.log('mensagem de botao...');
          mensagem = body.messages[0].message.buttonsResponseMessage.selectedDisplayText;
        } else if (body.messages[0].message.reactionMessage != null || body.messages[0].message.reactionMessage != undefined) {
          console.log('mensagem de reacao...');
          mensagem = 'gatilho-reacao';
        } else if (body.messages[0].message.reactionMessage != null || body.messages[0].message.reactionMessage != undefined) {
          console.log('mensagem de reacao...');
          mensagem = 'gatilho-reacao';
        } else if (body.messages[0].message.extendedTextMessage != null || body.messages[0].message.extendedTextMessage != undefined) {
          console.log('mensagem de resposta...');
          mensagem = body.messages[0].message.extendedTextMessage.text;
        } else {
          console.log('mensagem de link...')
          mensagem = 'gatilho-link';
        }

        const numeroRecebedor = body.messages[0].key.remoteJid.split('@')[0]

        await sleep(750);

        fetch("https://n8npainel.pageproc.com.br/webhook/unidade-1", {
          method: "POST",
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            "autor": numeroRecebedor,
            "mensagem": mensagem,
          })
        }).catch((onError) => {
          console.log(`Meu Erro 1: ${onError}`)
        });
        fetch("https://n8npainel.pageproc.com.br/webhook/unidade-2", {
          method: "POST",
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            "autor": numeroRecebedor,
            "mensagem": mensagem,
          })
        }).catch((onError) => {
          console.log(`Meu Erro 1: ${onError}`)
        });
        fetch("https://n8npainel.pageproc.com.br/webhook/unidade-3", {
          method: "POST",
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            "autor": numeroRecebedor,
            "mensagem": mensagem,
          })
        }).catch((onError) => {
          console.log(`Meu Erro 1: ${onError}`)
        });
      }
    }
  });
}

app.get('/conectar-bot', (req, res) => {
  const telefone = req.query.telefone;

  if (telefone == undefined || telefone == null) {
    res.status(500).send({ mensagem: 'O número de telefone deve ser uma String...' });
    return;
  }

  if (meuNumero == '') {
    meuNumero = telefone
  }

  if (baileysQR == '') {
    res.send({ dados: baileysQR, mensagem: 'Código QR já foi gerado e conectado!' })
  } else if (baileysQR.length > 1) {
    QRCode.toDataURL(baileysQR, function (err, url1) {
      res.send(`<img src=${url1} alt="QR-Code" /><h1>Caso der erro, por favor, atualize a página!</h1>`)
    })
  }
})

app.get('/desconectar-bot', async (req, res) => {
  try {
    fs.unlinkSync('./auth_info_multi.json');
    connectToWhatsApp()

    res.send({ status: 200, dados: '', mensagem: 'Bot exlcuído!' })

  } catch (onError) {
    res.send({ status: 500, dados: '', mensagem: onError.toString() })
  }
})

app.post('/enviar-mensagem', async (req, res) => {
  const texto = req.body.texto
  const telefones = req.body.telefones

  if (texto == undefined || texto == null) {
    res.status(500).send({ mensagem: 'O corpo da mensagem deve ser uma String...' });
    return;
  }

  if (telefones == undefined || telefones == null) {
    res.status(500).send({ mensagem: 'O corpo da mensagem deve ser uma String...' });
    return;
  }

  console.log(texto)
  console.log(telefones)

  let count = 0
  let numeros = []

  numeros = telefones.split(",").map((telefone) => `${telefone.replace(/\s/g, '')}`)

  res.send({ dados: null, mensagem: `Processando mensagens! Por favor, aguarde... Qualquer coisa, consulte o painel de sua API!` })

  for (var numero of numeros) {
    baileysBot.sendMessage(`${numero}@s.whatsapp.net`, { text: texto }).then((sucesso) => {
    }).catch((onError) => {
      console.log(`Erro -> ${onError}`)
      console.log(`Telefone -> ${numero}`)
    })
    await sleep(1000)
    count++
    if (count == 5) {
      count = 0
      await sleep(2500)
    }
  }
})

app.post('/enviar-mensagem-botao', async (req, res) => {
  const texto = req.body.texto
  const telefones = req.body.telefones

  const botao1 = req.body.botao1
  const botao2 = req.body.botao2
  const botao3 = req.body.botao3

  if (texto == undefined || texto == null) {
    res.status(500).send({ mensagem: 'O corpo da mensagem deve ser uma String...' });
    return;
  }

  if (telefones == undefined || telefones == null) {
    res.status(500).send({ mensagem: 'O corpo da mensagem deve ser uma String...' });
    return;
  }

  const buttons = [];

  if (botao1 != undefined && botao1 != null) {
    buttons.push({ buttonId: 'id1', buttonText: { displayText: botao1 }, type: 1 });
  }
  if (botao2 != undefined && botao2 != null) {
    buttons.push({ buttonId: 'id2', buttonText: { displayText: botao2 }, type: 1 });
  }
  if (botao3 != undefined && botao3 != null) {
    buttons.push({ buttonId: 'id3', buttonText: { displayText: botao3 }, type: 1 });
  }

  const buttonMessage = {
    text: texto,
    buttons: buttons,
    headerType: 1
  }

  let count = 0
  let numeros = []

  numeros = telefones.split(",").map((telefone) => `${telefone.replace(/\s/g, '')}`)

  res.send({ dados: null, mensagem: `Processando mensagens! Por favor, aguarde... Qualquer coisa, consulte o painel de sua API!` })

  for (var numero of numeros) {
    await baileysBot.sendMessage(`${numero}@s.whatsapp.net`, buttonMessage).then((sucesso) => {
    }).catch((onError) => {
      console.log(`Erro -> ${onError}`)
      console.log(`Telefone -> ${numero}`)
    })
    await sleep(1000)
    count++
    if (count == 5) {
      count = 0
      await sleep(2500)
    }
  }
})

app.post('/enviar-mensagem-imagem', async (req, res) => {
  const texto = req.body.texto
  const imagem = req.body.imagem

  const botao1 = req.body.botao1
  const botao2 = req.body.botao2
  const botao3 = req.body.botao3

  const telefones = req.body.telefones

  if (texto == undefined || texto == null) {
    res.status(500).send({ mensagem: 'O corpo da mensagem deve ser uma String...' });
    return;
  }
  if (imagem == undefined || imagem == null) {
    res.status(500).send({ mensagem: 'A URL da mensagem deve ser uma String...' });
    return;
  }
  if (telefones == undefined || telefones == null) {
    res.status(500).send({ mensagem: 'O número de telefone deve ser uma String...' });
    return;
  }

  const buttons = [];

  if (botao1 != undefined && botao1 != null) {
    buttons.push({ buttonId: 'id1', buttonText: { displayText: botao1 }, type: 1 });
  }
  if (botao2 != undefined && botao2 != null) {
    buttons.push({ buttonId: 'id2', buttonText: { displayText: botao2 }, type: 1 });
  }
  if (botao3 != undefined && botao3 != null) {
    buttons.push({ buttonId: 'id3', buttonText: { displayText: botao3 }, type: 1 });
  }

  const response = await fetch(imagem);
  const buffer = await response.buffer();

  const imageMessage = {
    image: buffer,
    caption: texto,
    buttons: buttons,
    headerType: 4,
  };

  let count = 0
  let numeros = []

  numeros = telefones.split(",").map((telefone) => `${telefone.replace(/\s/g, '')}`)

  res.send({ dados: null, mensagem: `Processando mensagens! Por favor, aguarde... Qualquer coisa, consulte o painel de sua API!` })

  for (var numero of numeros) {
    await baileysBot.sendMessage(`${numero}@s.whatsapp.net`, imageMessage).then((sucesso) => {
    }).catch((onError) => {
      console.log(`Erro -> ${onError}`)
      console.log(`Telefone -> ${numero}`)

    })
    await sleep(1000)
    count++
    if (count == 5) {
      count = 0
      await sleep(2500)
    }
  }
})

app.post('/enviar-mensagem-audio', async (req, res) => {
  const audio = req.body.audio
  const telefones = req.body.telefones

  if (telefones == undefined || telefones == null) {
    res.status(500).send({ mensagem: 'O número de telefone deve ser uma String...' });
  }
  if (audio == undefined || audio == null) {
    res.status(500).send({ mensagem: 'A URL do áudio deve ser uma String...' });
  }

  const response = await fetch(audio);
  const buffer = await response.buffer();


  let count = 0
  let numeros = []

  numeros = telefones.split(",").map((telefone) => `${telefone.replace(/\s/g, '')}`)

  res.send({ dados: null, mensagem: `Processando mensagens! Por favor, aguarde... Qualquer coisa, consulte o painel de sua API!` })

  for (var numero of numeros) {
    await baileysBot.sendMessage(`${numero}@s.whatsapp.net`, { audio: { url: audio }, mimetype: 'audio/mp4' }, { url: audio, }).then((sucesso) => {
    }).catch((onError) => {
      console.log(`Erro -> ${onError}`)
      console.log(`Telefone -> ${numero}`)
    })
    await sleep(1000)
    count++
    if (count == 5) {
      count = 0
      await sleep(2500)
    }
  }
})

app.post('/enviar-mensagem-video', async (req, res) => {
  const texto = req.body.texto
  const video = req.body.video
  const telefones = req.body.telefones

  if (telefones == undefined || telefones == null) {
    res.status(500).send({ mensagem: 'O número de telefone deve ser uma String...' });
    return;
  }
  if (texto == undefined || texto == null) {
    res.status(500).send({ mensagem: 'O corpo da mensagem deve ser uma String...' });
    return;
  }

  const response = await fetch(video);
  const buffer = await response.buffer();

  const videoMessage = {
    video: buffer,
    caption: texto
  };

  let count = 0
  let numeros = []

  numeros = telefones.split(",").map((telefone) => `${telefone.replace(/\s/g, '')}`)

  res.send({ dados: null, mensagem: `Processando mensagens! Por favor, aguarde... Qualquer coisa, consulte o painel de sua API!` })

  for (var numero of numeros) {
    await baileysBot.sendMessage(`${numero}@s.whatsapp.net`, videoMessage).then((sucesso) => {
    }).catch((onError) => {
      console.log(`Erro -> ${onError}`)
      console.log(`Telefone -> ${numero}`)
    })
    await sleep(1000)
    count++
    if (count == 5) {
      count = 0
      await sleep(2500)
    }
  }
})

app.post('/enviar-mensagem-template', async (req, res) => {
  const texto = req.body.texto
  const rodape = req.body.rodape
  const telefones = req.body.telefones

  const botaoLink1 = req.body.botaoLink1
  const botaoTexto1 = req.body.botaoTexto1


  if (telefones == undefined || telefones == null) {
    res.status(500).send({ mensagem: 'O número de telefone deve ser uma String...' });
    return;
  }
  if (texto == undefined || texto == null) {
    res.status(500).send({ mensagem: 'O corpo da mensagem deve ser uma String...' });
    return;
  }
  if (rodape == undefined || rodape == null) {
    res.status(500).send({ mensagem: 'O rodapé da mensagem deve ser uma String...' });
    return;
  }

  const templateButtons = [
    { index: 1, urlButton: { displayText: `${botaoTexto1}`, url: `${botaoLink1}` } },
  ]

  const templateMessage = {
    text: texto,
    footer: rodape,
    templateButtons: templateButtons
  }

  let count = 0
  let numeros = []

  numeros = telefones.split(",").map((telefone) => `${telefone.replace(/\s/g, '')}`)

  res.send({ dados: null, mensagem: `Processando mensagens! Por favor, aguarde... Qualquer coisa, consulte o painel de sua API!` })

  for (var numero of numeros) {
    await baileysBot.sendMessage(`${numero}@s.whatsapp.net`, templateMessage).then((sucesso) => {
    }).catch((onError) => {
      console.log(`Erro -> ${onError}`)
      console.log(`Telefone -> ${numero}`)
    })
    await sleep(1000)
    count++
    if (count == 5) {
      count = 0
      await sleep(2500)
    }
  }
})

app.post('/kiwify-compra-aprovada', async (req, res) => {
  const texto = req.body.texto

  const tipoCartao = req.body.card_type;
  const linkAcesso = req.body.access_url;
  const metodoPagamento = req.body.payment_method;
  const quatroDigitosCartao = req.body.card_last4digits;

  const numero = req.body.mobile
  const nomeTodo = req.body.full_name
  const nomeProduto = req.body.product_name

  const teste = req.body.teste
  const testeNumero = req.body.testeNumero

  let mensagem = ''

  mensagem = texto.replace('{linkAcesso}', linkAcesso)
  mensagem = mensagem.replace('{tipoCartao}', tipoCartao)
  mensagem = mensagem.replace('{metodoPagamento}', metodoPagamento)
  mensagem = mensagem.replace('{quatroDigitosCartao}', quatroDigitosCartao)

  mensagem = mensagem.replace('{nomeTodo}', nomeTodo)
  mensagem = mensagem.replace('{nomeProduto}', nomeProduto)

  mensagem = mensagem.replace('waiting_payment', 'esperando pagamento')
  mensagem = mensagem.replace('refunded', 'reembolsado')
  mensagem = mensagem.replace('refused', 'recusado')
  mensagem = mensagem.replace('paid', 'pago')

  mensagem = mensagem.replace('wrong_expiry_date', 'data de validade incorreta')
  mensagem = mensagem.replace('refused_bank', 'recusado pelo banco')
  mensagem = mensagem.replace('antifraud', 'anti-fraude')

  if (texto == undefined || texto == null) {
    res.status(500).send({ mensagem: 'O corpo da mensagem deve ser uma String...' });
    return;
  }

  let telefone = numero.replace('+', '')
    .replace('(', '').replace(')', '')
    .replace('-', '').replace(' ', '') + '@s.whatsapp.net'

  if (teste == true && testeNumero != null & testeNumero != undefined) {
    telefone = testeNumero.replace('+', '')
      .replace('(', '').replace(')', '')
      .replace('-', '').replace(' ', '') + '@s.whatsapp.net'
  }

  await baileysBot.sendMessage(telefone, { text: mensagem }).then((sucesso) => {
    res.send({ dados: null, mensagem: 'Sucesso ao enviar mensagem!' })
  }).catch((onError) => {
    res.send({ dados: null, mensagem: onError.toString() })
  })
})

app.post('/kiwify-compra-recusada', async (req, res) => {
  const texto = req.body.texto

  const tipoCartao = req.body.card_type;
  const linkAcesso = req.body.access_url;
  const metodoPagamento = req.body.payment_method;
  const quatroDigitosCartao = req.body.card_last4digits;
  const motivoRejeicaoCartao = req.body.card_rejection_reason

  const numero = req.body.mobile
  const nomeTodo = req.body.full_name
  const nomeProduto = req.body.product_name

  const teste = req.body.teste
  const testeNumero = req.body.testeNumero

  let mensagem = ''
  mensagem = texto.replace('{linkAcesso}', linkAcesso)
  mensagem = mensagem.replace('{tipoCartao}', tipoCartao)
  mensagem = mensagem.replace('{metodoPagamento}', metodoPagamento)
  mensagem = mensagem.replace('{quatroDigitosCartao}', quatroDigitosCartao)
  mensagem = mensagem.replace('{motivoRejeicaoCartao}', motivoRejeicaoCartao)

  mensagem = mensagem.replace('{nomeTodo}', nomeTodo)
  mensagem = mensagem.replace('{nomeProduto}', nomeProduto)

  mensagem = mensagem.replace('waiting_payment', 'esperando pagamento')
  mensagem = mensagem.replace('refunded', 'reembolsado')
  mensagem = mensagem.replace('refused', 'recusado')
  mensagem = mensagem.replace('paid', 'pago')

  mensagem = mensagem.replace('wrong_expiry_date', 'data de validade incorreta')
  mensagem = mensagem.replace('refused_bank', 'recusado pelo banco')
  mensagem = mensagem.replace('antifraud', 'anti-fraude')

  if (texto == undefined || texto == null) {
    res.status(500).send({ mensagem: 'O corpo da mensagem deve ser uma String...' });
    return;
  }

  let telefone = numero.replace('+', '')
    .replace('(', '').replace(')', '')
    .replace('-', '').replace(' ', '') + '@s.whatsapp.net'

  if (teste == true && testeNumero != null & testeNumero != undefined) {
    telefone = testeNumero.replace('+', '')
      .replace('(', '').replace(')', '')
      .replace('-', '').replace(' ', '') + '@s.whatsapp.net'
  }

  await baileysBot.sendMessage(telefone, { text: mensagem }).then((sucesso) => {
    res.send({ dados: null, mensagem: 'Sucesso ao enviar mensagem!' })
  }).catch((onError) => {
    res.send({ dados: null, mensagem: onError.toString() })
  })
})

app.post('/kiwify-boleto-gerado', async (req, res) => {
  const texto = req.body.texto

  const urlBoleto = req.body.boleto_URL;
  const statusOrdem = req.body.order_status;
  const codigoBoleto = req.body.boleto_barcode
  const metodoPagamento = req.body.payment_method;
  const expiracaoBoleto = req.body.boleto_expiry_date;

  const numero = req.body.mobile
  const nomeTodo = req.body.full_name
  const nomeProduto = req.body.product_name

  const teste = req.body.teste
  const testeNumero = req.body.testeNumero

  let mensagem = ''
  mensagem = texto.replace('{urlBoleto}', urlBoleto)
  mensagem = mensagem.replace('{statusOrdem}', statusOrdem)
  mensagem = mensagem.replace('{codigoBoleto}', codigoBoleto)
  mensagem = mensagem.replace('{metodoPagamento}', metodoPagamento)
  mensagem = mensagem.replace('{expiracaoBoleto}', expiracaoBoleto)

  mensagem = mensagem.replace('waiting_payment', 'esperando pagamento')
  mensagem = mensagem.replace('refunded', 'reembolsado')
  mensagem = mensagem.replace('refused', 'recusado')
  mensagem = mensagem.replace('paid', 'pago')

  mensagem = mensagem.replace('wrong_expiry_date', 'data de validade incorreta')
  mensagem = mensagem.replace('refused_bank', 'recusado pelo banco')
  mensagem = mensagem.replace('antifraud', 'anti-fraude')

  mensagem = mensagem.replace('{nomeTodo}', nomeTodo)
  mensagem = mensagem.replace('{nomeProduto}', nomeProduto)

  if (texto == undefined || texto == null) {
    res.status(500).send({ mensagem: 'O corpo da mensagem deve ser uma String...' });
    return;
  }

  let telefone = numero.replace('+', '')
    .replace('(', '').replace(')', '')
    .replace('-', '').replace(' ', '') + '@s.whatsapp.net'

  if (teste == true && testeNumero != null & testeNumero != undefined) {
    telefone = testeNumero.replace('+', '')
      .replace('(', '').replace(')', '')
      .replace('-', '').replace(' ', '') + '@s.whatsapp.net'
  }

  await baileysBot.sendMessage(telefone, { text: mensagem }).then((sucesso) => {
    res.send({ dados: null, mensagem: 'Sucesso ao enviar mensagem!' })
  }).catch((onError) => {
    res.send({ dados: null, mensagem: onError.toString() })
  })
})

app.post('/kiwify-reembolso', async (req, res) => {
  const texto = req.body.texto

  const statusOrdem = req.body.order_status;
  const dataReembolso = req.body.refunded_at;
  const metodoPagamento = req.body.payment_method;

  const numero = req.body.mobile
  const nomeTodo = req.body.full_name
  const nomeProduto = req.body.product_name

  const teste = req.body.teste
  const testeNumero = req.body.testeNumero

  let mensagem = ''
  mensagem = texto.replace('{statusOrdem}', statusOrdem)
  mensagem = mensagem.replace('{dataReembolso}', dataReembolso)
  mensagem = mensagem.replace('{metodoPagamento}', metodoPagamento)

  mensagem = mensagem.replace('waiting_payment', 'esperando pagamento')
  mensagem = mensagem.replace('refunded', 'reembolsado')
  mensagem = mensagem.replace('refused', 'recusado')
  mensagem = mensagem.replace('paid', 'pago')

  mensagem = mensagem.replace('wrong_expiry_date', 'data de validade incorreta')
  mensagem = mensagem.replace('refused_bank', 'recusado pelo banco')
  mensagem = mensagem.replace('antifraud', 'anti-fraude')

  mensagem = mensagem.replace('{nomeTodo}', nomeTodo)
  mensagem = mensagem.replace('{nomeProduto}', nomeProduto)

  if (texto == undefined || texto == null) {
    res.status(500).send({ mensagem: 'O corpo da mensagem deve ser uma String...' });
    return;
  }

  let telefone = numero.replace('+', '')
    .replace('(', '').replace(')', '')
    .replace('-', '').replace(' ', '') + '@s.whatsapp.net'

  if (teste == true && testeNumero != null & testeNumero != undefined) {
    telefone = testeNumero.replace('+', '')
      .replace('(', '').replace(')', '')
      .replace('-', '').replace(' ', '') + '@s.whatsapp.net'
  }

  await baileysBot.sendMessage(telefone, { text: mensagem }).then((sucesso) => {
    res.send({ dados: null, mensagem: 'Sucesso ao enviar mensagem!' })
  }).catch((onError) => {
    res.send({ dados: null, mensagem: onError.toString() })
  })
})

app.post('/kiwify-pix-gerado', async (req, res) => {
  const texto = req.body.texto

  const codigoPix = req.body.pix_code;
  const statusOrdem = req.body.order_status;
  const expiracaoPix = req.body.pix_expiration
  const metodoPagamento = req.body.payment_method;

  const numero = req.body.mobile
  const nomeTodo = req.body.full_name
  const nomeProduto = req.body.product_name

  const teste = req.body.teste
  const testeNumero = req.body.testeNumero

  let mensagem = ''
  mensagem = texto.replace('{codigoPix}', codigoPix)
  mensagem = mensagem.replace('{statusOrdem}', statusOrdem)
  mensagem = mensagem.replace('{expiracaoPix}', expiracaoPix)
  mensagem = mensagem.replace('{metodoPagamento}', metodoPagamento)

  mensagem = mensagem.replace('{nomeTodo}', nomeTodo)
  mensagem = mensagem.replace('{nomeProduto}', nomeProduto)

  mensagem = mensagem.replace('waiting_payment', 'esperando pagamento')
  mensagem = mensagem.replace('refunded', 'reembolsado')
  mensagem = mensagem.replace('refused', 'recusado')
  mensagem = mensagem.replace('paid', 'pago')

  mensagem = mensagem.replace('wrong_expiry_date', 'data de validade incorreta')
  mensagem = mensagem.replace('refused_bank', 'recusado pelo banco')
  mensagem = mensagem.replace('antifraud', 'anti-fraude')

  let telefone = numero.replace('+', '')
    .replace('(', '').replace(')', '')
    .replace('-', '').replace(' ', '') + '@s.whatsapp.net'

  if (texto == undefined || texto == null) {
    res.status(500).send({ mensagem: 'O corpo da mensagem deve ser uma String...' });
    return;
  }

  if (teste == true && testeNumero != null & testeNumero != undefined) {
    telefone = testeNumero.replace('+', '')
      .replace('(', '').replace(')', '')
      .replace('-', '').replace(' ', '') + '@s.whatsapp.net'
  }

  await baileysBot.sendMessage(telefone, { text: mensagem }).then((sucesso) => {
    res.send({ dados: null, mensagem: 'Sucesso ao enviar mensagem!' })
  }).catch((onError) => {
    res.send({ dados: null, mensagem: onError.toString() })
  })
})

app.post('/kiwify-carrinho-abandonado', async (req, res) => {
  const texto = req.body.texto

  const numero = req.body.phone
  const nomeTodo = req.body.name
  const nomeProduto = req.body.product_name
  const linkCheckout = req.body.checkout_link

  const teste = req.body.teste
  const testeNumero = req.body.testeNumero

  let mensagem = ''
  mensagem = texto.replace('{linkCheckout}', linkCheckout)

  mensagem = mensagem.replace('{nomeTodo}', nomeTodo)
  mensagem = mensagem.replace('{nomeProduto}', nomeProduto)

  if (texto == undefined || texto == null) {
    res.status(500).send({ mensagem: 'O corpo da mensagem deve ser uma String...' });
    return;
  }

  let telefone = numero.replace('+', '')
    .replace('(', '').replace(')', '')
    .replace('-', '').replace(' ', '') + '@s.whatsapp.net'

  if (teste == true && testeNumero != null & testeNumero != undefined) {
    telefone = testeNumero.replace('+', '')
      .replace('(', '').replace(')', '')
      .replace('-', '').replace(' ', '') + '@s.whatsapp.net'
  }

  await baileysBot.sendMessage(telefone, { text: mensagem }).then((sucesso) => {
    res.send({ dados: null, mensagem: 'Sucesso ao enviar mensagem!' })
  }).catch((onError) => {
    res.send({ dados: null, mensagem: onError.toString() })
  })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
  connectToWhatsApp()
})
