import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { Appbar, TouchableRipple } from "react-native-paper";
import { Image as ExpoImage } from "expo-image";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedMovie, fetchMovies } from "../store";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { logoutUser } from "../store";
import { Animated, Easing } from "react-native";

const colors = {
  primaryBg: "#1C2526",
  text: "#F5F6F5",
  accent: "#FFD700",
  primaryAction: "#D32F2F",
};

const tabs = ["All", "Movies", "Scripts", "Storytelling"];

const MovieSelectionScreen = () => {
  const dispatch = useDispatch();
  const { movies, loading, error } = useSelector((state) => state.movie);
  const user = useSelector((state) => state.auth.user);
  const [activeTab, setActiveTab] = useState("All");
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchAnim] = useState(new Animated.Value(0));
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const toggleSearch = () => {
    const toValue = searchVisible ? 0 : 1;
    setSearchVisible(!searchVisible);

    Animated.timing(searchAnim, {
      toValue,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  };

  const publishedMovies = movies.filter(
    (movie) => movie.status === "published"
  );

  const filteredMovies = publishedMovies.filter((m) => {
    const matchTab =
      activeTab === "All" || m.type.toLowerCase() === activeTab.toLowerCase();
    const matchSearch = m.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchTab && matchSearch;
  });

  const noSearchResults =
    searchQuery.trim().length > 0 && filteredMovies.length === 0;

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
    } catch (error) {
      console.log("Logout failed", error.message);
    }
  };

  useEffect(() => {
    dispatch(fetchMovies());
  }, [dispatch]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading movies...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableRipple
            style={styles.retryButton}
            onPress={() => dispatch(fetchMovies())}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableRipple>
        </View>
      </SafeAreaView>
    );
  }

  const renderMovie = ({ item }) => (
    <TouchableOpacity
      style={styles.movieCard}
      onPress={() => dispatch(setSelectedMovie(item))}
      activeOpacity={0.8}
    >
      <ExpoImage
        source={{ uri: item.thumbnail }}
        style={styles.movieThumbnail}
        contentFit="contain"
        cachePolicy="memory-disk"
      />

      <View style={styles.overlay}>
        <View style={styles.titleRow}>
          {item.type === "scripts" && (
            <ExpoImage
              source={require("../assets/red-quill-clip.png")}
              style={styles.scriptIcon}
              cachePolicy="memory-disk"
            />
          )}
          <Text numberOfLines={2} style={styles.movieTitle}>
            {item.title}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderStory = ({ item }) => (
    <TouchableOpacity
      style={styles.storyCard}
      onPress={() => dispatch(setSelectedMovie(item))}
      activeOpacity={0.8}
    >
      <ExpoImage
        source={{ uri: item.thumbnail }}
        style={styles.storyThumbnail}
        contentFit="contain"
        cachePolicy="memory-disk"
      />

      <View style={styles.storyOverlay}>
        <Text numberOfLines={2} style={styles.storyTitle}>
          {item.title}
        </Text>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => dispatch(setSelectedMovie(item))}
        >
          <Text style={styles.playButtonText}>Play</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaProvider>
      <Appbar.Header
        style={[styles.appbarHeader, searchVisible && { height: 160 }]}
      >
        <View style={styles.topRowContainer}>
          <View style={styles.topRow}>
            <Image
              source={require("../assets/logo.png")}
              style={styles.logo}
              contentFit="contain"
            />
            <View style={styles.rightIcons}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={toggleSearch}
              >
                <Ionicons name="search" size={24} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.userInitialContainer}
                onPress={() => setDropdownVisible(!dropdownVisible)}
              >
                <Text style={styles.userInitialText}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {dropdownVisible && (
            <View style={styles.dropdownWrapper}>
              <View style={styles.dropdownContainer}>
                <Text style={styles.dropdownUsername}>
                  Hi, {user?.name || "User"}
                </Text>
                <TouchableOpacity
                  onPress={handleLogout}
                  style={styles.dropdownLogoutBtn}
                >
                  <Text style={styles.dropdownLogoutText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {searchVisible && (
            <Animated.View
              style={[
                styles.searchBarContainer,
                {
                  height: searchAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 40],
                  }),
                  opacity: searchAnim,
                  marginTop: searchAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 8],
                  }),
                  overflow: "hidden",
                },
              ]}
            >
              <Ionicons
                name="search"
                size={20}
                color="#555"
                style={{ marginRight: 6 }}
              />
              <TextInput
                placeholder="Search movies..."
                placeholderTextColor="#666"
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </Animated.View>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          <TouchableOpacity style={styles.menuTab} onPress={() => {}}>
            <Ionicons name="apps" size={20} color={colors.primaryBg} />
          </TouchableOpacity>
          <View style={styles.tabDivider} />
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                activeTab === tab && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Appbar.Header>

      <SafeAreaView
        style={styles.container}
        edges={["left", "right", "bottom"]}
      >
        <View style={styles.whiteContainer}>
          {noSearchResults ? (
            <View>
              <Text style={styles.noMoviesText}>No search results found</Text>
            </View>
          ) : activeTab === "All" ? (
            <ScrollView
              contentContainerStyle={styles.scrollContainer}
              nestedScrollEnabled={true}
            >
              {["movies", "scripts", "storytelling"].map((type) => {
                const sectionMovies = filteredMovies.filter(
                  (m) => m.type.toLowerCase() === type
                );

                if (sectionMovies.length === 0) return null;

                return (
                  <View key={type} style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                    {type === "storytelling" ? (
                      <FlatList
                        data={sectionMovies}
                        renderItem={renderStory}
                        keyExtractor={(item) => item.id.toString()}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.storyList}
                      />
                    ) : (
                      <FlatList
                        data={sectionMovies}
                        renderItem={renderMovie}
                        keyExtractor={(item) => item.id.toString()}
                        numColumns={2}
                        columnWrapperStyle={styles.row}
                        contentContainerStyle={styles.flatListContent}
                        scrollEnabled={false}
                      />
                    )}
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.sectionContainer}>
              {filteredMovies.length > 0 ? (
                <>
                  <Text style={styles.sectionTitle}>{activeTab}</Text>

                  <FlatList
                    data={filteredMovies}
                    renderItem={renderMovie}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={styles.flatListContent}
                  />
                </>
              ) : (
                <Text style={styles.noMoviesText}>No {activeTab} found</Text>
              )}
            </View>
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fab81e",
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: colors.text,
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    color: colors.primaryAction,
    fontSize: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.primaryBg,
    fontSize: 16,
    fontWeight: "bold",
  },

  appbarHeader: {
    backgroundColor: "#fab81e",
    height: Platform.OS === "ios" ? 140 : 120,
    flexDirection: "column",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 20 : 0,
  },

  topRowContainer: {
    width: "100%",
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  logo: {
    width: 60,
    height: 60,
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    marginLeft: 16,
  },

  userInitialContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    marginRight: 5,
  },
  userInitialText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },

  tabsContent: {
    alignItems: "center",
  },

  menuTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "white",
  },

  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginRight: 6,
    backgroundColor: "#deba66",
  },

  activeTabButton: {
    backgroundColor: colors.primaryBg,
  },

  tabText: {
    color: colors.text,
    fontWeight: "600",
  },

  activeTabText: {
    color: colors.text,
  },
  tabDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#93908a",
    marginHorizontal: 12,
  },

  scrollContainer: {
    paddingBottom: 100,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C2526",
    marginBottom: 12,
    marginLeft: 6,
  },
  whiteContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 10,
    marginTop: 10,
  },

  row: {
    justifyContent: "flex-start",
  },

  flatListContent: {
    paddingBottom: 40,
  },

  movieCard: {
    flex: 1,
    margin: 6,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000",
    maxWidth: "48%",
  },

  movieThumbnail: {
    width: "100%",
    height: 200,
    backgroundColor: "#000",
  },

  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 8,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  movieTitle: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
    flexShrink: 1,
    marginLeft: 4,
  },

  scriptIcon: {
    width: 20,
    height: 20,
    contentFit: "contain",
  },
  storyCard: {
    width: 160,
    marginRight: 12,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000",
  },

  storyThumbnail: {
    width: "100%",
    height: 200,
    backgroundColor: "#000",
  },

  storyOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 8,
    alignItems: "center",
  },

  storyTitle: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 6,
  },

  playButton: {
    backgroundColor: "#fab81e",
    borderRadius: 16,
    paddingHorizontal: 50,
    paddingVertical: 6,
  },

  playButtonText: {
    color: "#1C2526",
    fontWeight: "700",
    fontSize: 12,
  },

  storyList: {
    paddingLeft: 6,
    paddingRight: 16,
  },
  logoutButton: {
    color: "#413939ff",
    backgroundColor: colors.text,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    fontSize: 16,
    fontWeight: "700",
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 4,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#000",
    paddingVertical: 4,
  },
  noMoviesText: {
    color: "#555",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 24,
  },

  dropdownWrapper: {
    position: "absolute",
    top: 42,
    right: 0,
    alignItems: "flex-end",
    zIndex: 1000,
  },

  dropdownContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    width: 150,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
  },

  dropdownUsername: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1C2526",
    marginBottom: 10,
    textAlign: "center",
  },

  dropdownLogoutBtn: {
    backgroundColor: "#fab81e",
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: "center",
  },

  dropdownLogoutText: {
    color: "#1C2526",
    fontWeight: "700",
    fontSize: 12,
  },
});

export default MovieSelectionScreen;
