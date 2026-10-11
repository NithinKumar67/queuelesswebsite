const path = require('path');
const dotenv = require('dotenv');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

dotenv.config({
  path: path.join(__dirname, '../.env')
});

const { validateEnv, getAllowedOrigins } = require('./config/env');

// Fail fast, with a readable message, if required configuration is missing.
// This must run before ./app is loaded because app.js creates the session store.
try {
  validateEnv();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const { connectDB } = require('./config/db');
const app = require('./app');
const User = require('./models/User');

const PORT = process.env.PORT || 5000;
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: getAllowedOrigins(),
    credentials: true
  }
});

// Reuse the existing Express session and Passport authentication.
const sessionMiddleware = app.get('sessionMiddleware');
const passport = app.get('passport');

io.engine.use(sessionMiddleware);
io.engine.use(passport.initialize());
io.engine.use(passport.session());

// Allow controllers to emit Socket.IO events.
app.set('io', io);

const isValidObjectId = (value) =>
  typeof value === 'string' && OBJECT_ID_PATTERN.test(value);

// Authenticate connected sockets and authorize office-room subscriptions.
io.on('connection', (socket) => {
  const sessionUser = socket.request.user;

  if (!sessionUser?._id) {
    socket.disconnect(true);
    return;
  }

  // Load the current user from the database. The promise is created
  // synchronously and the event handlers below are registered immediately,
  // so an event sent by the client right after "connect" (such as
  // office:join) is never dropped while this lookup is still in flight.
  const userPromise = User.findById(sessionUser._id).select(
    '_id role officeId counterId'
  );

  userPromise
    .then((user) => {
      if (!user) socket.disconnect(true);
    })
    .catch((error) => {
      console.error('Socket user lookup error:', error.message);
      socket.disconnect(true);
    });

  const withUser = (handler) => async (requestedOfficeId, callback) => {
    const reply = typeof callback === 'function' ? callback : () => {};

    try {
      const user = await userPromise;

      if (!user) {
        return reply({ success: false, message: 'User not found' });
      }

      return await handler(user, requestedOfficeId, reply);
    } catch (error) {
      console.error('Office room error:', error.message);

      return reply({
        success: false,
        message: 'Could not update office room subscription'
      });
    }
  };

  // Operators can only use their assigned office room.
  // Citizens and admins can join offices to follow or monitor queues.
  const canUseRoom = (user, officeId) =>
    ['citizen', 'operator', 'admin'].includes(user.role) &&
    !(user.role === 'operator' && user.officeId?.toString() !== officeId);

  socket.on(
    'office:join',
    withUser(async (user, officeId, reply) => {
      if (!isValidObjectId(officeId)) {
        return reply({ success: false, message: 'Invalid office ID' });
      }

      if (!canUseRoom(user, officeId)) {
        return reply({
          success: false,
          message:
            user.role === 'operator'
              ? 'You cannot access this office room'
              : 'Role is not allowed to join office rooms'
        });
      }

      await socket.join(`office:${officeId}`);

      return reply({
        success: true,
        message: 'Joined office room',
        officeId
      });
    })
  );

  socket.on(
    'office:leave',
    withUser(async (user, officeId, reply) => {
      if (!isValidObjectId(officeId)) {
        return reply({ success: false, message: 'Invalid office ID' });
      }

      if (user.role === 'operator' && user.officeId?.toString() !== officeId) {
        return reply({
          success: false,
          message: 'You cannot access this office room'
        });
      }

      await socket.leave(`office:${officeId}`);

      return reply({
        success: true,
        message: 'Left office room',
        officeId
      });
    })
  );
});

let shuttingDown = false;

// Stop accepting connections, close sockets, then close MongoDB.
const shutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`${signal} received, shutting down...`);

  const forceExit = setTimeout(() => {
    console.error('Shutdown timed out, forcing exit');
    process.exit(1);
  }, 10000);
  forceExit.unref();

  try {
    await io.close(); // also closes the underlying HTTP server
    await app.get('sessionStore')?.close();
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error.message);
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
