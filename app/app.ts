import cors from 'cors';
import express from 'express';
import router from './routes/chat';

const app: express.Application = express();

const options: cors.CorsOptions = {
  origin: '*'
};

app.use(express.json());
app.use(cors(options));
app.use('/chat', router)

app.listen('8080', function() {
  console.log('listening on http://localhost:8080');
});

