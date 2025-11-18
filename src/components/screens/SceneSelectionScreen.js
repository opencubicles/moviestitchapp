import { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  Image,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { setSelectedMovie } from "../../store/index";
import SceneSection from "./SceneSection";
import Icon from "react-native-vector-icons/Ionicons";
import { Button, useTheme } from "react-native-paper";
import { Appbar } from "react-native-paper";
import StitchedPreviewScreen from "./StitchedPreviewScreen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Platform } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import { Alert } from "react-native";

const colors = {
  primaryBg: "#1C2526",
  accent: "#FFD700",
};

const screenWidth = Dimensions.get("window").width;

const SceneSelectionScreen = ({ children }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const movie = useSelector((state) => state.movie.selectedMovie);
  const selectedSceneStitch = useSelector(
    (state) => state.movie.selectedSceneStitch
  );
  const [showStitchedModal, setShowStitchedModal] = useState(false);

  const getAllSelectedSubmissions = () => {
    if (!movie || !movie.scenes || !selectedSceneStitch) return [];

    const allSelected = [];

    movie.scenes.forEach((scene) => {
      if (scene.subscenes) {
        scene.subscenes.forEach((subscene) => {
          const subsceneSelections = selectedSceneStitch[subscene.id];

          if (subsceneSelections) {
            Object.values(subsceneSelections).forEach((selectedVideo) => {
              if (selectedVideo && selectedVideo.id) {
                allSelected.push({
                  sceneId: scene.id,
                  sceneTitle: scene.title,
                  subsceneId: subscene.id,
                  subsceneName: subscene.name,
                  video: selectedVideo,
                  submissionId: selectedVideo.id,
                });
              }
            });
          }
        });
      }
    });

    return allSelected;
  };

  const getSelectedSubmissionsCount = () => {
    return getAllSelectedSubmissions().length;
  };

  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollToIndex = (index) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  };

  const goBackToMovies = () => {
    router.replace("/movies");
    setTimeout(() => dispatch(setSelectedMovie(null)), 100);
  };

  return (
    <SafeAreaProvider style={styles.container}>
      <View style={styles.backgroundLayer}>
        <View style={styles.yellowSection} />
        <View style={styles.lightSection} />
      </View>
      <Appbar.Header
        style={{
          backgroundColor: "#fab81e",
          paddingTop: Platform.OS === "ios" ? 0 : 0,
          height: 106,
        }}
      >
        <View style={styles.logoTitleContainer}>
          <ExpoImage
            source={require("../../../assets/logo.png")}
            style={styles.logo}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
          <View style={styles.titleRow}>
            {movie?.type === "scripts" && (
              <ExpoImage
                source={require("../../../assets/red-quill-clip.png")}
                style={styles.scriptIcon}
                cachePolicy="memory-disk"
              />
            )}
            <Text style={styles.title}>{movie.title}</Text>
          </View>
        </View>
      </Appbar.Header>

      <View style={styles.sceneSwiper}>
        <FlatList
          ref={flatListRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          data={movie.scenes}
          keyExtractor={(item) => item.id.toString()}
          onMomentumScrollEnd={(e) => {
            const offset = e.nativeEvent.contentOffset.x;
            const newIndex = Math.round(offset / screenWidth);
            setCurrentIndex(newIndex);
          }}
          getItemLayout={(_, index) => ({
            length: screenWidth,
            offset: screenWidth * index,
            index,
          })}
          snapToInterval={screenWidth}
          decelerationRate="fast"
          renderItem={({ item: scene }) => (
            <View style={styles.sceneSlide}>
              <SceneSection scene={scene} />

              {currentIndex > 0 && (
                <TouchableOpacity
                  style={[styles.navButton, { left: 10 }]}
                  onPress={() => scrollToIndex(currentIndex - 1)}
                >
                  <Icon name="chevron-back" size={28} color="#fab81e" />
                </TouchableOpacity>
              )}

              {currentIndex < movie.scenes.length - 1 && (
                <TouchableOpacity
                  style={[styles.navButton, { right: 10 }]}
                  onPress={() => scrollToIndex(currentIndex + 1)}
                >
                  <Icon name="chevron-forward" size={28} color="#fab81e" />
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      </View>

      <StitchedPreviewScreen
        visible={showStitchedModal}
        onClose={() => setShowStitchedModal(false)}
        sceneId={0}
      />
      <Appbar style={styles.bottomBar}>
        <Appbar.Action
          icon={() => <Icon name="arrow-back" size={24} color="#fff" />}
          onPress={goBackToMovies}
          style={styles.iconButton}
        />

        <Button
          mode="contained"
          icon="movie"
          onPress={() => {
            if (getSelectedSubmissionsCount() === 0) {
              Alert.alert(
                "No videos selected",
                "Please select a video to stitch."
              );
              return;
            }
            setShowStitchedModal(true);
          }}
          textColor="#FFFFFF"
          style={[styles.stitchButton, { backgroundColor: "#fdbd18" }]}
          labelStyle={styles.label}
        >
          {getSelectedSubmissionsCount() > 0
            ? `Stitch Movie (${getSelectedSubmissionsCount()})`
            : "Stitch Movie"}
        </Button>
        <Appbar.Action
          icon={() => (
            <Icon name="ellipsis-horizontal" size={24} color="#fff" />
          )}
          onPress={() => {}}
          style={styles.iconButton}
        />
      </Appbar>
      {children}
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  backgroundLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: Dimensions.get("window").height,
    zIndex: -1,
  },
  yellowSection: {
    height: Dimensions.get("window").height * 0.28,
    backgroundColor: "#fab81e",
  },
  appBar: {
    backgroundColor: "#fab81e",
  },
  lightSection: {
    flex: 1,
    backgroundColor: "#F0F0F0",
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fffddd",
    textAlign: "center",
  },
  sceneSwiper: {
    flex: 1,
  },
  logoTitleContainer: {
    flex: 1,
    alignItems: "center",
    paddingBottom: 5,
  },
  logo: {
    width: 70,
    height: 70,
  },
  sceneSlide: {
    width: screenWidth,
    justifyContent: "center",
    alignItems: "center",
  },

  bottomBar: {
    backgroundColor: colors.primaryBg,
    flexDirection: "row",
    justifyContent: "space-between",
    height: Platform.OS === "ios" ? 100 : 150,
  },
  stitchButton: {
    borderRadius: 30,
    height: 50,
    justifyContent: "center",
    flex: 0,
    marginHorizontal: 10,
  },
  iconButton: {
    backgroundColor: "#484848",
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: "center",
  },
  label: { fontSize: 20, fontWeight: "bold" },
  navButton: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -15 }],
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 20,
    padding: 6,
    zIndex: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
    gap: 2,
  },

  scriptIcon: {
    width: 34,
    height: 34,
  },
});

export default SceneSelectionScreen;
