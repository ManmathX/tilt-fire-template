import { StatusBar } from "expo-status-bar";
import { TouchableWithoutFeedback, Pressable } from "react-native";
import { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Dimensions, Text, Image } from "react-native";
import { Accelerometer } from "expo-sensors";
import { Video, Audio } from "expo-av";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 50;

const BULLET_WIDTH = 8;
const BULLET_HEIGHT = 15;

const ENEMY_WIDTH = 45;
const ENEMY_HEIGHT = 45;

const GAME_SPEED_INITIAL = 3;
const ENEMY_SPAWN_RATE = 1500; // ms

export default function App() {
  const [playerX, setPlayerX] = useState((screenWidth - PLAYER_WIDTH) / 2);
  const [bullets, setBullets] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const gameSpeedRef = useRef(GAME_SPEED_INITIAL);
  const lastShotRef = useRef(0);
  const soundRef = useRef(null);
  const gameOverSoundRef = useRef(null);

  useEffect(() => {
    Accelerometer.setUpdateInterval(16);

    const subscription = Accelerometer.addListener(({ x }) => {
      const move = x * 25;

      setPlayerX((prevX) => {
        const newX = prevX + move;
        const minX = 0;
        const maxX = screenWidth - PLAYER_WIDTH;
        return Math.max(minX, Math.min(newX, maxX));
      });
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const loadSound = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        const { sound: bgSound } = await Audio.Sound.createAsync(
          require("./assets/VHS LOGOS - SONY.mp3")
        );
        soundRef.current = bgSound;
        await bgSound.setIsLoopingAsync(true);
        await bgSound.playAsync();

        const { sound: goSound } = await Audio.Sound.createAsync(
          require("./assets/What a noob - Sound Effect.mp3")
        );
        gameOverSoundRef.current = goSound;
      } catch (error) {
        console.error("Error loading sound:", error);
      }
    };

    loadSound();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setBullets((prevBullets) =>
        prevBullets
          .filter((bullet) => bullet.y > 0)
          .map((bullet) => ({
            ...bullet,
            y: bullet.y - 15,
          }))
      );
    }, 16);

    return () => clearInterval(interval);
  }, [gameOver]);

  useEffect(() => {
    if (gameOver) return;

    const spawnEnemy = setInterval(() => {
      const newEnemy = {
        id: Date.now().toString(),
        x: Math.random() * (screenWidth - ENEMY_WIDTH),
        y: -ENEMY_HEIGHT,
        health: 1,
      };
      setEnemies((prev) => [...prev, newEnemy]);
    }, ENEMY_SPAWN_RATE);

    return () => clearInterval(spawnEnemy);
  }, [gameOver]);

  useEffect(() => {
    if (gameOver) return;

    const moveEnemies = setInterval(() => {
      setEnemies((prevEnemies) => {
        return prevEnemies
          .map((enemy) => ({
            ...enemy,
            y: enemy.y + gameSpeedRef.current,
          }))
          .filter((enemy) => {
            if (enemy.y >= screenHeight) {
              setGameOver(true);
              return false;
            }
            return true;
          });
      });
    }, 16);

    return () => clearInterval(moveEnemies);
  }, [gameOver]);

  useEffect(() => {
    if (gameOver) {
      if (soundRef.current) {
        soundRef.current.stopAsync();
      }
      if (gameOverSoundRef.current) {
        gameOverSoundRef.current.playAsync();
      }
    }
  }, [gameOver]);

  useEffect(() => {
    if (gameOver) return;

    const checkHits = setInterval(() => {
      setBullets((prevBullets) => {
        let updatedBullets = [...prevBullets];

        setEnemies((prevEnemies) => {
          let updatedEnemies = [...prevEnemies];

          for (let i = updatedBullets.length - 1; i >= 0; i--) {
            const bullet = updatedBullets[i];

            for (let j = updatedEnemies.length - 1; j >= 0; j--) {
              const enemy = updatedEnemies[j];

              if (
                bullet.x < enemy.x + ENEMY_WIDTH &&
                bullet.x + BULLET_WIDTH > enemy.x &&
                bullet.y < enemy.y + ENEMY_HEIGHT &&
                bullet.y + BULLET_HEIGHT > enemy.y
              ) {
                updatedBullets.splice(i, 1);
                updatedEnemies.splice(j, 1);
                setScore((s) => s + 10);

                if (score % 100 === 0 && score > 0) {
                  gameSpeedRef.current += 0.5;
                }

                break;
              }
            }
          }

          return updatedEnemies;
        });

        return updatedBullets;
      });
    }, 16);

    return () => clearInterval(checkHits);
  }, [gameOver, score]);

  const handleBullet = () => {
    const now = Date.now();
    if (now - lastShotRef.current < 200) return;
    lastShotRef.current = now;

    const bullet = {
      id: Date.now().toString(),
      x: playerX + (PLAYER_WIDTH - BULLET_WIDTH) / 2,
      y: screenHeight - PLAYER_HEIGHT - 40,
    };

    setBullets((prev) => [...prev, bullet]);
  };

  const handleRestart = () => {
    setPlayerX((screenWidth - PLAYER_WIDTH) / 2);
    setBullets([]);
    setEnemies([]);
    setScore(0);
    setGameOver(false);
    gameSpeedRef.current = GAME_SPEED_INITIAL;
    lastShotRef.current = 0;
    // Restart background music
    if (soundRef.current) {
      soundRef.current.playAsync();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handleBullet}>
      <View style={styles.container}>
        <View style={styles.hud}>
          <Text style={styles.hudText}>Score: {score}</Text>
        </View>

        <Image
          source={require("./assets/Screenshot 2025-11-20 at 6.31.30 PM.png")}
          style={[styles.player, { left: playerX, bottom: 20, width: PLAYER_WIDTH, height: PLAYER_HEIGHT }]}
        />

        {bullets.map((bullet) => (
          <View
            key={bullet.id}
            style={[
              styles.bullet,
              { left: bullet.x, top: bullet.y },
            ]}
          />
        ))}

        {enemies.map((enemy) => (
          <Image
            key={enemy.id}
            source={require("./assets/stock-vector-cute-smile-green-pig-monster-in-pixel-art-style-with-isolated-background-2622428795.png")}
            style={[
              styles.enemy,
              { left: enemy.x, top: enemy.y, width: ENEMY_WIDTH, height: ENEMY_HEIGHT },
            ]}
          />
        ))}

        {gameOver && (
          <View style={styles.gameOverOverlay}>
            <Video
              source={require("./assets/28993-372617967.mp4")}
              rate={1.0}
              volume={1.0}
              isMuted={false}
              resizeMode="cover"
              shouldPlay
              isLooping
              style={styles.gameOverVideo}
            />
            <View style={styles.gameOverContent}>
        
              <Text style={styles.finalScore}>Final Score: {score}</Text>
              <Pressable
                style={styles.restartButton}
                onPress={handleRestart}
              >
                <Text style={styles.restartButtonText}>RESTART</Text>
              </Pressable>
            </View>
          </View>
        )}

        <StatusBar style="light" />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0e27",
    justifyContent: "flex-end",
    alignItems: "center",
    overflow: "hidden",
  },

  hud: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 100,
  },

  hudText: {
    color: "#00ff88",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Courier",
    textShadowColor: "#00ff88",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },

  player: {
    position: "absolute",
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    resizeMode: "contain",
  },

  bullet: {
    position: "absolute",
    width: BULLET_WIDTH,
    height: BULLET_HEIGHT,
    backgroundColor: "#ffff00",
    borderRadius: 2,
    shadowColor: "#ffff00",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },

  enemy: {
    position: "absolute",
    width: ENEMY_WIDTH,
    height: ENEMY_HEIGHT,
    backgroundColor: "#0a0e27",
    borderWidth: 2,
    borderColor: "#0a0e27",
    borderRadius: 4,
    shadowColor: "#0a0e27",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },

  gameOverOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 200,
  },

  gameOverVideo: {
    width: "75%",
    aspectRatio: 16 / 9,
    borderRadius: 8,
    overflow: "hidden",
  },

  gameOverContent: {
    marginTop: 24,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 201,
  },

  gameOverText: {
    color: "#fff",
    fontSize: 52,
    fontWeight: "900",
    marginBottom: 30,
    letterSpacing: 2,
  },

  finalScore: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "600",
    marginBottom: 50,
  },

  restartButton: {
    paddingHorizontal: 50,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderRadius: 6,
  },

  restartButtonText: {
    color: "#0a0e27",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
