set -e

psql --username "$POSTGRES_USER" <<-EOSQL
CREATE DATABASE dist_sys_ev_3;
EOSQL
psql --dbname "dist_sys_ev_3" --username "$POSTGRES_USER" <<-EOSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE SCHEMA users;
CREATE SCHEMA posts;
CREATE SCHEMA friends;
CREATE TABLE users.users (
    user_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_name VARCHAR(25) UNIQUE,
    user_email VARCHAR(75) UNIQUE,
    user_password VARCHAR(256) NOT NULL,
    user_role VARCHAR(50) NOT NULL
);
CREATE TABLE posts.posts (
    post_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_body VARCHAR(200) NOT NULL,
    post_date TIMESTAMP NOT NULL,
    post_owner_id UUID REFERENCES users.users ON DELETE CASCADE ON UPDATE CASCADE,
    parent_post_id UUID REFERENCES posts.posts ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE posts.likes (
    like_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    like_owner_id UUID REFERENCES users.users,
    liked_post_id UUID REFERENCES posts.posts,
    UNIQUE(like_owner_id, liked_post_id)
);
CREATE TABLE friends.friendships (
    friendship_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users.users,
    friend_id UUID REFERENCES users.users
);
CREATE TABLE friends.requests (
    request_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    request_owner_id UUID REFERENCES users.users,
    requested_to_id UUID REFERENCES users.users,
    request_status VARCHAR(25) NOT NULL
);
EOSQL