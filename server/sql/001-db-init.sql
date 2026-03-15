/*
-- Create Enum Types first
CREATE TYPE game_status AS ENUM ('waiting', 'in_progress', 'finished');
CREATE TYPE player_role AS ENUM ('advocate', 'lobbyist', 'unassigned');

-- express-sessions
CREATE TABLE sessions
(
    sid    varchar PRIMARY KEY,
    sess   json         NOT NULL,
    expire timestamp(6) NOT NULL
);

-- Players
CREATE TABLE players (
    player_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    wins INT DEFAULT 0,
    losses INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    temp BOOLEAN DEFAULT TRUE
);

-- Games
CREATE TABLE games (
    game_id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    host_id INT NOT NULL,
    max_players INT NOT NULL,
    player_count INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP, 
    status game_status DEFAULT 'waiting',

    FOREIGN KEY (host_id) REFERENCES players(player_id) ON DELETE CASCADE
);

-- Players In Game
CREATE TABLE game_players (
    game_id INT NOT NULL,
    player_id INT NOT NULL,
    role player_role DEFAULT 'unassigned',

    PRIMARY KEY (game_id, player_id),

    FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(player_id) ON DELETE CASCADE
);

-- needed by @socket.io/postgres-adapter
CREATE TABLE socket_io_attachments
(
    id         bigserial UNIQUE,
    created_at timestamptz DEFAULT NOW(),
    payload    bytea
);