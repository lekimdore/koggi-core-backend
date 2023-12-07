import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import GibberishAES from 'dz-gibberish-aes/dist/gibberish-aes-1.0.0.js';

import SecretManager from './utils/secretManager.js';
import envs from './utils/envs.js';
import registerApiRouter from './components/auth/auth.routes.js';

const secretManager = new SecretManager();

envs();

const app = express();

let corsWhiteList = [];
let cspDefaultDirectives = [];

if (process.env.NODE_ENV === 'prod') {
  corsWhiteList = [
    'https://clientes.koggi.co',
    'https://davinci-onegroup-prod.uc.r.appspot.com',
    'https://apis-terceros-dot-davinci-onegroup-prod.uc.r.appspot.com',
    'https://auth-dot-davinci-onegroup-prod.uc.r.appspot.com',
    'https://backend-sale-dot-davinci-onegroup-prod.uc.r.appspot.com',
  ];
  cspDefaultDirectives = [
    'https://davinci-oup-prod.firebaseapp.com',
    'https://apis-terceros-dot-davinci-onegroup-prod.uc.r.appspot.com',
    'https://api4.my-ip.io/ip.json',
    'https://www.koggi.co',
    'https://koggiprodjwt-dot-davinci-onegroup-prod.uc.r.appspot.com',
    'https://app-asisa-dot-davinci-one-id-prod.uc.r.appspot.com',
    'https://auth-dot-davinci-one-id-prod.uc.r.appspot.com',
    'https://webapi-dot-davinci-one-id-prod.appspot.com',
    'https://app-val-dot-davinci-one-id-prod.uc.r.appspot.com',
    'https://datacredito-prod-dot-producto-davinci-prototipos.appspot.com',
    'https://producto-davinci-prototipos.appspot.com',
    'https://extract-data-pdf-p7y2xr7jdq-ue.a.run.app',
    'https://koggiqajwt-dot-davinci-onegroup-sqa.uc.r.appspot.com',
    'https://storage.googleapis.com',
    'https://face-recognition-imsgzfxtwq-uc.a.run.app',
    'https://cdn.jsdelivr.net',
    'https://www.google.com/recaptcha',
    'https://securetoken.googleapis.com',
    'https://admin-dot-davinci-one-id-prod.uc.r.appspot.com',
    'https://auth-dot-davinci-onegroup-prod.uc.r.appspot.com',
    'https://backend-sale-dot-davinci-onegroup-prod.uc.r.appspot.com',
  ];
} else if (process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'qa') {
  corsWhiteList = [
    'http://localhost:8080',
    'http://localhost:4200',
    'http://localhost:4201',
    'https://qa.onegroup.io',
    'https://davinci-onegroup-sqa.uc.r.appspot.com',
    'https://apis-terceros-dot-davinci-onegroup-sqa.uc.r.appspot.com',
    'https://auth-dot-davinci-onegroup-sqa.uc.r.appspot.com',
    'https://backend-sale-dot-davinci-onegroup-sqa.uc.r.appspot.com/',
  ];
  cspDefaultDirectives = [
    'https://davinci-oup-sqa.firebaseapp.com',
    'https://api4.my-ip.io/ip.json',
    'https://app-asisa-dot-davinci-oneid-qa.uc.r.appspot.com',
    'https://auth-dot-davinci-oneid-qa.uc.r.appspot.com',
    'https://webapi-dot-davinci-oneid-qa.appspot.com',
    'https://app-val-dot-davinci-oneid-qa.uc.r.appspot.com',
    'https://datacredito-prod-dot-producto-davinci-prototipos.appspot.com',
    'https://producto-davinci-prototipos.appspot.com',
    'https://extract-data-pdf-p7y2xr7jdq-ue.a.run.app',
    'https://koggiqajwt-dot-davinci-onegroup-sqa.uc.r.appspot.com',
    'https://storage.googleapis.com',
    'https://one-id-face-recognition-p7y2xr7jdq-uc.a.run.app',
    'https://cdn.jsdelivr.net',
    'https://www.google.com/recaptcha',
    'https://apis-terceros-dot-davinci-onegroup-sqa.uc.r.appspot.com',
    'https://securetoken.googleapis.com',
    'https://admin-dot-davinci-oneid-dev.uc.r.appspot.com',
    'https://auth-dot-davinci-onegroup-sqa.uc.r.appspot.com',
    'https://backend-sale-dot-davinci-onegroup-sqa.uc.r.appspot.com',
  ];
}

const corsOptions = {
  origin: (origin, callback) => {
    if (
      corsWhiteList.indexOf('*') !== -1 ||
      corsWhiteList.indexOf(origin) !== -1 ||
      !origin
    ) {
      callback(null, true);
    } else {
      console.log('denegado', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
};

app.use(cors(corsOptions));

// Globales
let sendedKey;

app.use(helmet.dnsPrefetchControl());
app.use(helmet.expectCt());
app.use(helmet.frameguard({ action: 'sameorigin' }));
app.use(helmet.hidePoweredBy());
app.use(helmet.hsts());
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.referrerPolicy());
app.use(helmet.xssFilter());

const directives = {
  'frame-ancestors': ["'self'", 'https://koggi.co'],
  'form-action': ["'self'"],
  'object-src': ["'none'"],
  'connect-src': [
    "'self'",
    'https://www.googleapis.com',
    'https://firebasestorage.googleapis.com',
  ].concat(cspDefaultDirectives),
  'frame-src': [
    "'self'",
    'https://www.google.com',
    'https://lookerstudio.google.com/',
  ].concat(cspDefaultDirectives),
  'script-src': [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    'blob:',
    'https://apis.google.com',
    'https://securetoken.googleapis.com',
    'https://connect.facebook.net',
    'https://www.facebook.com',
  ].concat(cspDefaultDirectives),
  'default-src': [
    "'self'",
    'https://www.google.com',
    'https://fonts.gstatic.com',
    'https://www.googleapis.com',
    'https://connect.facebook.net',
    'https://www.facebook.com',
    'https://www.google-analytics.com',
    'https://apis.google.com',
    'https://firestore.googleapis.com',
    'https://firebasestorage.googleapis.com',
    'http://aplicaciones.adres.gov.co',
  ].concat(cspDefaultDirectives),
  'style-src': [
    "'self'",
    "'unsafe-inline'",
    'https://www.google.com',
    'https://www.facebook.com',
    'https://securetoken.googleapis.com',
    'https://fonts.googleapis.com',
    'http://aplicaciones.adres.gov.co',
  ],
  'img-src': [
    "'self'",
    'data:',
    'https://storage.googleapis.com',
    'https://www.facebook.com',
    'https://securetoken.googleapis.com',
    'https://www.google.com',
    'http://aplicaciones.adres.gov.co',
  ],
};
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      ...directives,
    },
  }),
);

app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser({ httpOnly: true, secure: true, sameSite: 'strict' }));

app.use(
  express.static(path.join(__dirname, '/public/'), {
    etag: true,
    lastModified: true,
    setHeaders: (res, pathD) => {
      const hashRegExp = /\.[0-9a-f]{8}\./;
      if (pathD.endsWith('.html')) {
        // All of the project's HTML files end in .html
        res.header(
          'Cache-Control',
          'private, no-cache, no-store, must-revalidate',
        );
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');
      } else if (pathD.endsWith('.css')) {
        // All of the project's HTML files end in .html
        res.header(
          'Cache-Control',
          'private, no-cache, no-store, must-revalidate',
        );
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');
      } else if (hashRegExp.test(pathD)) {
        // If the RegExp matched, then we have a versioned URL.
        res.setHeader('Cache-Control', 'max-age=31536000');
      }
    },
  }),
);

app.use(async (req, res, next) => {
  /**Se colocan en excepciones jobs de scheduler para no afectarse por el cifrado */
  console.log('path c' + req.path);
  if (
    req.path.indexOf('/api/xyzpath') != -1 ||
    req.path.indexOf('/api/xyzpath2') != -1
  )
    return next();

  // if (!sendedKey) sendedKey = await obtenerCifrado();
  let sendKeyCounts = 1;
  const sendKeyAttemps = 10;
  while (!sendedKey && sendKeyCounts <= sendKeyAttemps) {
    await new Promise((resolve) => setTimeout(resolve, sendKeyCounts * 100));
    sendedKey = await obtenerCifrado();
    sendKeyCounts++;
  }

  if (!sendedKey)
    return res
      .status(500)
      .send('NO autorizado para ver el servicio. sendedKey');
  if (req.method == 'POST')
    if (req.headers['content-type'].includes('form-data;')) return next();
  if (req.method == 'GET' && req.query.data) {
    req.query.data = GibberishAES.dec(
      Buffer.from(req.query.data, 'base64').toString(),
      sendedKey,
    );
  }
  if (req.method == 'POST' && req.body.data) {
    req.body = JSON.parse(
      GibberishAES.dec(
        Buffer.from(req.body.data, 'base64').toString(),
        sendedKey,
      ),
    );
  }
  var oldSend = res.send;
  res.send = function (data) {
    if (res.headersSent) {
      return;
    }
    if (res.req.method == 'GET' || res.req.method == 'POST') {
      if (typeof data == 'object') data = JSON.stringify(data);
      data = Buffer.from(GibberishAES.enc(data, sendedKey)).toString('base64');
      arguments[0] = JSON.stringify({ data });
    }
    oldSend.apply(res, arguments);
  };
  next();
});

let obtenerCifrado = async function () {
  let cifrado = await secretManager.getSecret(process.env.CIFRADO, false);
  return cifrado;
};

obtenerCifrado()
  .then((r) => {
    sendedKey = r;
  })
  .catch((e) => {
    console.error(e);
  });

app.use(
  '/assets/',
  express.static(path.join(__dirname, '../assets/'), {
    etag: true, // Just being explicit about the default.
    lastModified: true, // Just being explicit about the default.
    setHeaders: (res, pathD) => {
      const hashRegExp = /\.[0-9a-f]{8}\./;
      if (pathD.endsWith('.html')) {
        // All of the project's HTML files end in .html
        res.header(
          'Cache-Control',
          'private, no-cache, no-store, must-revalidate',
        );
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');
      } else if (pathD.endsWith('.css')) {
        // All of the project's HTML files end in .html
        res.header(
          'Cache-Control',
          'private, no-cache, no-store, must-revalidate',
        );
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');
      } else if (hashRegExp.test(path)) {
        // If the RegExp matched, then we have a versioned URL.
        res.setHeader('Cache-Control', 'max-age=31536000');
      }
    },
  }),
);

registerApiRouter(app);

app.use(
  '*',
  express.static(path.join(__dirname, '/public/'), {
    etag: true, // Just being explicit about the default.
    lastModified: true, // Just being explicit about the default.
    setHeaders: (res, pathD) => {
      const hashRegExp = /\.[0-9a-f]{8}\./;
      if (pathD.endsWith('.html')) {
        // All of the project's HTML files end in .html
        res.header(
          'Cache-Control',
          'private, no-cache, no-store, must-revalidate',
        );
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');
      } else if (pathD.endsWith('.css')) {
        // All of the project's HTML files end in .html
        res.header(
          'Cache-Control',
          'private, no-cache, no-store, must-revalidate',
        );
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');
      } else if (hashRegExp.test(pathD)) {
        // If the RegExp matched, then we have a versioned URL.
        res.setHeader('Cache-Control', 'max-age=31536000');
      }
    },
  }),
);

export default app;
