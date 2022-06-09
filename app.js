const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const app = express();
app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertPlayerDbToResponse = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDbToResponse = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
    SELECT
      *
    FROM
      player_details;`;
  const playersArray = await db.all(getPlayerQuery);
  response.send(
    playersArray.map((eachPlayer) => convertPlayerDbToResponse(eachPlayer))
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT
    *
    FROM
    player_details
    WHERE 
    player_id = ${playerId};`;

  const player = await db.get(getPlayerQuery);
  response.send(convertPlayerDbToResponse(player));
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT
    *
    FROM
    match_details
    WHERE 
    match_id = ${matchId};`;

  const matchArray = await db.get(getMatchQuery);
  response.send(convertMatchDbToResponse(matchArray));
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchQuery = `
    SELECT
    *
    FROM
     player_match_score
    NATURAL JOIN match_details
    WHERE 
    player_id = ${playerId};`;

  const matchDetails = await db.all(getPlayerMatchQuery);
  response.send(
    matchDetails.map((eachMatch) => convertMatchDbToResponse(eachMatch))
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerDetailsQuery = `
    SELECT
    *
    FROM
     player_match_score
    NATURAL JOIN 
    player_details
    WHERE
    match_id = ${matchId};`;

  const playerDetails = await db.all(getPlayerDetailsQuery);
  response.send(
    playerDetails.map((eachPlayer) => convertPlayerDbToResponse(eachPlayer))
  );
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScoreQuery = `
    SELECT
    player_id as playerId,
    player_name as playerName,
    SUM(score) as totalScore,
    SUM(fours) as totalFours,
    SUM(sixes) as totalSixes
    FROM
    player_match_score
    NATURAL JOIN
    player_details 
    WHERE 
    player_id = ${playerId};`;

  const playerMatchDetails = await db.get(getPlayerScoreQuery);
  response.send(playerMatchDetails);
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerName } = request.body;
  const { playerId } = request.params;

  const updatePlayerName = `
    UPDATE 
    player_details
    SET
    player_name = '${playerName}'
    WHERE 
    player_id = ${playerId}; `;

  await db.run(updatePlayerName);
  response.send("Player Details Updated");
});

module.exports = app;
