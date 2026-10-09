const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const testSeriesRoutes = require('./routes/testSeriesRoutes');
const planRoutes = require('./routes/planRoutes');
const cartRoutes = require('./routes/cartRoutes');
const evaluatorRoutes = require('./routes/evaluatorRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const contactRoutes = require('./routes/contactRoutes');
const blogRoutes = require('./routes/blogRoutes');
const { router: paymentRoutes, webhookRouter } = require('./routes/paymentRoutes');
const { notFound, errorHandler } = require('./utils/errorHandler');
const { initializeStorageDirectories } = require('./utils/fileUpload');
const { seedDefaultUsers } = require('./utils/seedUsers');
const User = require('./models/User');
const ROLES = require('./constants/roles');

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  await connectDB();

  // Initialize storage directories
  initializeStorageDirectories();

  // Seed default users (admin, evaluator, student)
  await seedDefaultUsers();

  const app = express();
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  }));

  // Enable CORS for all origins (dynamic)
  app.use(cors({
    origin: (origin, callback) => {
      // Allow any origin
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  }));

  app.use(compression());
  app.use(express.json({ limit: '50mb' })); // Increased limit to handle 20MB PDFs with base64 encoding + overhead
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(morgan('dev'));

  // Serve static files for uploads (allow cross-origin resource loading for images/PDFs)
  app.use('/uploads', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  }, express.static(path.join(__dirname, '../storage')));

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  // Webhook route (before other routes to avoid auth middleware)
  app.use('/api/payments', webhookRouter);

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/test-series', testSeriesRoutes);
  app.use('/api/plans', planRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/evaluators', evaluatorRoutes);
  app.use('/api/students', studentRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/schedules', scheduleRoutes);
  app.use('/api', contactRoutes);
  app.use('/api/blogs', blogRoutes);
  app.use('/api/payments', paymentRoutes);

  app.use(notFound);
  app.use(errorHandler);

  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

bootstrap();
