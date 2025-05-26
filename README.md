# Spotify Artist Saver Web App

A web application to search for artists on Spotify, save your favorites, and browse their top tracks with playable previews.

## Features

*   Search for artists on Spotify.
*   Save artists to a personal list stored in MongoDB.
*   View a list of all saved artists.
*   View the top tracks for any saved artist, fetched from Spotify.
*   Play 30-second previews of tracks (where available).
*   Simple, clean user interface.

## Prerequisites

*   [Node.js](https://nodejs.org/) (which includes npm)
*   A [MongoDB Atlas account](https://www.mongodb.com/cloud/atlas) and a database cluster.
*   A [Spotify Developer account](https://developer.spotify.com/dashboard/) and an application registered to get a Client ID and Client Secret.

## Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd <repository_directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Configuration

1.  **Create a `.env` file:**
    Copy the example environment file:
    ```bash
    cp .env.example .env
    ```

2.  **Edit the `.env` file** and provide your specific credentials and settings:

    *   `MONGODB_URI`: Your MongoDB Atlas connection string.
        *   Example: `mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority`
    *   `SPOTIFY_CLIENT_ID`: Your Spotify application Client ID.
    *   `SPOTIFY_CLIENT_SECRET`: Your Spotify application Client Secret.
    *   `PORT`: The port on which the application will run (defaults to 3000 if not specified).

## Running the Application

1.  **Start the server:**
    ```bash
    npm start
    ```
    (This will typically run `node app.js` based on the default `package.json` start script).

2.  Open your web browser and navigate to `http://localhost:PORT` (e.g., `http://localhost:3000` if you're using the default port).

---
Built with Node.js, Express, EJS, Mongoose, and the Spotify API.
