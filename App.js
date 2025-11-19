import { StatusBar } from "expo-status-bar";
import { TouchableWithoutFeedback } from "react-native";
import { useState, useEffect } from "react";
import { View, StyleSheet, Dimensions, Text } from "react-native";
import { Accelerometer } from "expo-sensors";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 50;

const BULLET_WIDTH = 10;
const BULLET_HEIGHT = 20;

const BLOCK_WIDTH = 40;
const BLOCK_HEIGHT = 40;

export default function App() {
  const [playerX, setPlayerX] = useState(
    (screenWidth - PLAYER_WIDTH) / 2
  );

  const [bullets, setBullets] = useState([]);

  // Accelerometer control
  useEffect(() => {
    Accelerometer.setUpdateInterval(16);

    const subscription = Accelerometer.addListener(({ x }) => {
      const move = x * 20;

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
    const interval = setInterval(() => {
      setBullets((prevBullets) =>
        prevBullets
          .map((bullet) => ({
            ...bullet,
            y: bullet.y - 10,
          }))
      );
    }, 16);

    return () => clearInterval(interval);
  }, []);
  const handleBullet = () => {
    const bullet = {
      id: Date.now().toString(),
      x: playerX + (PLAYER_WIDTH - BULLET_WIDTH) / 2,
      y: screenHeight - PLAYER_HEIGHT - 40, // starting near player
    };

    setBullets((prev) => [...prev, bullet]);
  };

  return (
    <TouchableWithoutFeedback onPress={handleBullet}>
      <View style={styles.container}>
        {/* Player */}
        <View style={[styles.player, { left: playerX }]} />

        <Text style={styles.instruction}>Tilt your phone to move</Text>

        {/* Bullets */}
        {bullets.map((bullet) => (
          <View
            key={bullet.id}
            style={[
              styles.bullet,
              { left: bullet.x, top: bullet.y },
            ]}
          />
        ))}

        <StatusBar style="auto" />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 60,
  },

  player: {
    position: "absolute",
    bottom: 20,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: "#000",
  },

  instruction: {
    position: "absolute",
    top: 70,
    color: "#fff",
    fontFamily: "Courier",
    fontSize: 14,
  },

  bullet: {
    position: "absolute",
    width: BULLET_WIDTH,
    height: BULLET_HEIGHT,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#000",
  },

  fallingBlock: {
    position: "absolute",
    width: BLOCK_WIDTH,
    height: BLOCK_HEIGHT,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "black",
  },

  gameOverText: {
    position: "absolute",
    top: screenHeight / 2 - 40,
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "Courier",
  },
});
