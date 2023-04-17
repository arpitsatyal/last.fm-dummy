const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const app = express();

const LASTFM_USER = process.env.LASTFM_API_KEY;
const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const LASTFM_API_SECRET = process.env.LASTFM_API_SECRET;

async function editScrobble(props) {
  for (let i = 0; i < props.length; i++) {
    const artist = props[i].artist;
    const track = props[i].name;
    const timestamp = Math.floor(Date.now() / 1000);

    const params = {
      method: "track.scrobble",
      api_key: LASTFM_API_KEY,
      artist,
      track: track.replace(/ remaster$/i, ""),
      timestamp,
      sk: timestamp,
      username: LASTFM_USER,
    };

    const paramKeys = Object.keys(params).sort();
    const paramString = paramKeys.map((key) => key + params[key]).join("");
    const apiSig = crypto
      .createHash("md5")
      .update(paramString + LASTFM_API_SECRET)
      .digest("hex");

    axios
      .post("http://ws.audioscrobbler.com/2.0/", {
        ...params,
        apiSig,
      })
      .then((response) => {
        console.log(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }
}

app.get("/scrobbles", (req, res) => {
  axios
    .get(
      `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USER}&api_key=${LASTFM_API_KEY}&limit=25&format=json`
    )
    .then(async (response) => {
      const scrobbles = response.data.recenttracks.track;
      const containsRemaster = scrobbles
        .map((scrobble) => ({
          artist: scrobble.artist["#text"],
          name: scrobble.name,
        }))
        .filter((song) => song.name.toLowerCase().includes("remaster"));

      await editScrobble(containsRemaster);

      res.status(200).json(containsRemaster);
    })
    .catch((error) => {
      console.log(error);
    });
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
