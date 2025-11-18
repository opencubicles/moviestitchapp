import {
  configureStore,
  createSlice,
  createAsyncThunk,
} from "@reduxjs/toolkit";
import {
  movieStitchApi,
  MOVIE_STITCH_API_BASE_URL,
} from "../api/movieStitchApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

// Async thunk for fetching movies from API
export const fetchMovies = createAsyncThunk(
  "movie/fetchMovies",
  async (_, { rejectWithValue }) => {
    try {
      const apiData = await movieStitchApi.fetchScripts();
      return movieStitchApi.transformApiData(apiData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for generating movie
export const generateMovie = createAsyncThunk(
  "movie/generateMovie",
  async (_, { rejectWithValue, getState }) => {
    try {
      const { selectedSubmissions, aiMode, selectedMovie } = getState().movie;
      const movieType = selectedMovie?.type;

      let submissionsToUse;

      if (aiMode) {
        const movieId = getState().movie.selectedMovie.id;
        const movie = getState().movie.movies.find((m) => m.id === movieId);
        if (movie && movie.mainSets) {
          const submissionsFromEachSet = movie.mainSets.reduce(
            (acc, mainSet) => {
              if (mainSet.sets && mainSet.sets.length > 0) {
                const firstSet = mainSet.sets[0];
                if (firstSet.submissions && firstSet.submissions.length > 0) {
                  const randomIndex = Math.floor(
                    Math.random() * firstSet.submissions.length
                  );
                  const randomSubmission = firstSet.submissions[randomIndex];
                  acc[firstSet.id] = randomSubmission.id;
                }
              }
              return acc;
            },
            {}
          );
          submissionsToUse = submissionsFromEachSet;
        } else {
          console.log("Movie or mainSets not found");
        }
      } else {
        submissionsToUse = selectedSubmissions;
      }

      let submissionData;
      if (movieType === "storytelling") {
        submissionData = Object.values(submissionsToUse).flat();
      } else {
        submissionData = Object.values(submissionsToUse);
      }
      const response = await movieStitchApi.generateMovie(submissionData);

      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for downloading movie
export const downloadMovie = createAsyncThunk(
  "movie/downloadMovie",
  async (_, { rejectWithValue, getState, dispatch }) => {
    try {
      const { selectedSubmissions, aiMode, selectedMovie } = getState().movie;
      const movieType = selectedMovie?.type;

      let submissionsToUse;

      if (aiMode) {
        const movieId = getState().movie.selectedMovie.id;
        const movie = getState().movie.movies.find((m) => m.id === movieId);
        if (movie && movie.mainSets) {
          const submissionsFromEachSet = movie.mainSets.reduce(
            (acc, mainSet) => {
              if (mainSet.sets && mainSet.sets.length > 0) {
                const firstSet = mainSet.sets[0];
                if (firstSet.submissions && firstSet.submissions.length > 0) {
                  const randomIndex = Math.floor(
                    Math.random() * firstSet.submissions.length
                  );
                  const randomSubmission = firstSet.submissions[randomIndex];
                  acc[firstSet.id] = randomSubmission.id;
                }
              }
              return acc;
            },
            {}
          );
          submissionsToUse = submissionsFromEachSet;
        }
      } else {
        submissionsToUse = selectedSubmissions;
      }

      let submissionData;
      if (movieType === "storytelling") {
        submissionData = Object.values(submissionsToUse).flat();
      } else {
        submissionData = Object.values(submissionsToUse);
      }
      const response = await movieStitchApi.generateMovieMp4(submissionData);
      return response;
    } catch (error) {
      console.error("Error in downloadMovie:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const handleSubmitComment = createAsyncThunk(
  "movie/handleSubmitComment",
  async (comment, { getState, dispatch, rejectWithValue }) => {
    const { currentSubSceneId, tempVideoKey } = getState().movie;
    if (!comment || !currentSubSceneId || !tempVideoKey) {
      Alert.alert("Error", "Missing comment, subscene, or video reference.");
      return rejectWithValue("Invalid submission data");
    }

    const submissionData = {
      set_id: currentSubSceneId,
      comment: comment,
      video_file_key: tempVideoKey,
    };

    try {
      await movieStitchApi.addUserSubmission(submissionData);
      Alert.alert("Success", "Video uploaded and submission saved!");
      dispatch(setCommentModalVisible(false));
      dispatch(setTempVideoKey(null));
      dispatch(setCurrentSubSceneId(null));
    } catch (error) {
      console.error("Failed to save submission:", error);
      Alert.alert("Error", "Failed to save submission to database.");
      return rejectWithValue(error.message);
    }
  }
);

export const uploadFile = async (fileUri, presignedData) => {
  if (fileUri) {
    try {
      const response = await fetch(fileUri);
      if (!response.ok) {
        throw new Error(
          `Failed to read file: ${response.status} ${response.statusText}`
        );
      }
      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error("File is empty or could not be read");
      }
      const uploadResponse = await fetch(presignedData.url, {
        method: "PUT",
        body: blob,
        headers: presignedData.headers || {
          "Content-Type": "video/mp4",
        },
      });
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("Upload failed with status:", uploadResponse.status);
        console.error("Error response:", errorText);
        throw new Error(
          `Failed to upload file: ${uploadResponse.status} ${uploadResponse.statusText}`
        );
      }
      return uploadResponse;
    } catch (error) {
      console.error("Upload error:", error);
      setError(`Failed to upload file: ${error.message}`);
      throw error;
    }
  } else {
    throw new Error("No file provided for upload");
  }
};

export const uploadVideo = createAsyncThunk(
  "movie/uploadVideo",
  async (subSceneId, { dispatch, rejectWithValue }) => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow media library access."
        );
        return rejectWithValue("Permission denied");
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["videos"],
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 60,
      });

      if (result.canceled || !result.assets[0]) return;

      const videoAsset = result.assets[0];
      let videoFilename = videoAsset.fileName || `video_${Date.now()}.mp4`;
      videoFilename = videoFilename.replace(/[^a-zA-Z0-9._-]/g, "_");

      const presignedData = await movieStitchApi.getPresignedUrls(
        videoFilename
      );
      const { urls, keys } = presignedData;

      const response = await fetch(videoAsset.uri);
      const blob = await response.blob();

      const uploadResponse = await fetch(urls.videoUrl.url, {
        method: "PUT",
        body: blob,
        headers: urls.videoUrl.headers || { "Content-Type": "video/mp4" },
      });

      if (!uploadResponse.ok) throw new Error("Upload failed");

      dispatch(setTempVideoKey(keys.videoKey));
      dispatch(setCurrentSubSceneId(subSceneId));
      dispatch(setCommentModalVisible(true));
    } catch (err) {
      console.error(err);
      Alert.alert("Error", err.message || "Video upload failed.");
      return rejectWithValue(err.message);
    }
  }
);

export const captureVideo = createAsyncThunk(
  "movie/captureVideo",
  async (subSceneId, { dispatch, rejectWithValue }) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please allow camera access.");
        return rejectWithValue("Permission denied");
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["videos"],
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 60,
      });

      if (result.canceled || !result.assets[0]) return;

      const videoAsset = result.assets[0];
      let videoFilename = `video_${Date.now()}.mp4`;

      const presignedData = await movieStitchApi.getPresignedUrls(
        videoFilename
      );
      const { urls, keys } = presignedData;

      const response = await fetch(videoAsset.uri);
      const blob = await response.blob();

      const uploadResponse = await fetch(urls.videoUrl.url, {
        method: "PUT",
        body: blob,
        headers: urls.videoUrl.headers || { "Content-Type": "video/mp4" },
      });

      if (!uploadResponse.ok) throw new Error("Upload failed");

      dispatch(setTempVideoKey(keys.videoKey));
      dispatch(setCurrentSubSceneId(subSceneId));
      dispatch(setCommentModalVisible(true));
    } catch (err) {
      console.error(err);
      Alert.alert("Error", err.message || "Capture failed.");
      return rejectWithValue(err.message);
    }
  }
);

// Auth async thunks
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${MOVIE_STITCH_API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 422) {
          const errorMessage = data.message || "Validation failed";
          return rejectWithValue(errorMessage);
        } else if (response.status === 401) {
          const errorMessage = data.message || "Invalid credentials";
          return rejectWithValue(errorMessage);
        } else if (response.status === 404) {
          return rejectWithValue(
            "API endpoint not found. Please check your configuration."
          );
        } else {
          const errorMessage =
            data.message || `Login failed with status ${response.status}`;
          return rejectWithValue(errorMessage);
        }
      }

      if (!data.token || !data.user) {
        return rejectWithValue("Invalid response from server");
      }

      await AsyncStorage.setItem("authToken", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));

      return data;
    } catch (error) {
      console.log("Login error:", error);

      if (error.name === "TypeError" && error.message.includes("fetch")) {
        return rejectWithValue(
          "Network error. Please check your internet connection and API URL."
        );
      }

      if (error.name === "SyntaxError") {
        return rejectWithValue("Invalid response from server");
      }

      return rejectWithValue(error.message || "An unexpected error occurred");
    }
  }
);

export const signupUser = createAsyncThunk(
  "auth/signupUser",
  async (
    { name, email, password, password_confirmation },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`${MOVIE_STITCH_API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          password_confirmation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || "Signup failed");
      }

      if (!data.token || !data.user) {
        return rejectWithValue("Invalid response from server");
      }

      await AsyncStorage.setItem("authToken", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));

      return data;
    } catch (error) {
      return rejectWithValue(error.message || "An unexpected error occurred");
    }
  }
);

export const checkAuthStatus = createAsyncThunk(
  "auth/checkAuthStatus",
  async (_, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const user = await AsyncStorage.getItem("user");

      if (token && user) {
        return {
          user: JSON.parse(user),
          token,
          isAuthenticated: true,
        };
      }

      return {
        user: null,
        token: null,
        isAuthenticated: false,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("user");
      return true;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Password Reset Thunks
export const requestResetOtp = createAsyncThunk(
  "authReset/requestResetOtp",
  async ({ email }, { rejectWithValue }) => {
    try {
      const res = await fetch(
        `${MOVIE_STITCH_API_BASE_URL}/request-reset-otp`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.message || "Failed to send OTP";
        return rejectWithValue(msg);
      }
      return { message: data.message || "OTP sent" };
    } catch (err) {
      if (err.name === "TypeError")
        return rejectWithValue("Network error. Check API URL or internet.");
      return rejectWithValue(err.message || "Unexpected error");
    }
  }
);

// 2) Verify OTP
export const verifyResetOtp = createAsyncThunk(
  "authReset/verifyResetOtp",
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${MOVIE_STITCH_API_BASE_URL}/verify-reset-otp`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data.message || "OTP verification failed";
        return rejectWithValue(msg);
      }
      return {
        resetToken: data.reset_token || null,
        message: data.message || "OTP verified",
      };
    } catch (err) {
      console.error("Verify OTP Error:", err);
      if (err.name === "TypeError")
        return rejectWithValue("Network error. Check API URL or internet.");
      return rejectWithValue(err.message || "Unexpected error");
    }
  }
);

// 3) Reset Password
export const resetPassword = createAsyncThunk(
  "authReset/resetPassword",
  async (
    { email, reset_token, password, password_confirmation },
    { rejectWithValue }
  ) => {
    try {
      const res = await fetch(`${MOVIE_STITCH_API_BASE_URL}/reset-password`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          reset_token,
          password,
          password_confirmation,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.message || "Password reset failed";
        return rejectWithValue(msg);
      }
      return { message: data.message || "Password reset successful" };
    } catch (err) {
      if (err.name === "TypeError")
        return rejectWithValue("Network error. Check API URL or internet.");
      return rejectWithValue(err.message || "Unexpected error");
    }
  }
);

const movieSlice = createSlice({
  name: "movie",
  initialState: {
    movies: [],
    selectedMovie: null,
    aiMode: false,
    selectedSubScenes: {},
    selectedVideos: {},
    videoToPlay: null,
    selectModeScenes: {},
    selectedSceneStitch: {},
    selectedMovieStitch: {},
    loading: false,
    error: null,
    startTime: 0,
    endTime: null,
    selectedSubmissions: {},
    generatedMovie: null,
    generatingMovie: false,
    generateMovieError: null,

    uploading: false,
    uploadModalVisible: false,
    commentModalVisible: false,
    currentSubSceneId: null,
    tempVideoKey: null,
  },
  reducers: {
    setMovies: (state, action) => {
      state.movies = action.payload;
    },
    setSelectedMovie: (state, action) => {
      state.selectedMovie = action.payload;
    },
    setSelectedSubScenes: (state, action) => {
      state.selectedSubScenes = action.payload;
    },
    setAiMode: (state, action) => {
      state.aiMode = action.payload;
    },
    setSelectedVideos: (state, action) => {
      state.selectedVideos = action.payload;
    },
    setSelectedSubmissions: (state, action) => {
      state.selectedSubmissions = action.payload;
    },
    setVideoToPlay(state, action) {
      state.startTime = action.payload.startTime || 0;
      state.endTime = action.payload.endTime || null;
      state.videoToPlay = action.payload;
    },
    clearVideoToPlay(state) {
      state.videoToPlay = null;
      state.selectedVideos = {};
      state.selectedSubScenes = {};
      state.selectedSubmissions = {};
      state.selectedSceneStitch = {};
    },
    setSelectModeScene: (state, action) => {
      const { sceneId, isActive } = action.payload;
      state.selectModeScenes[sceneId] = isActive;
      if (!isActive) state.selectedSceneStitch = {};
    },
    setSelectedSceneStitch: (state, action) => {
      const { sceneId, videoId } = action.payload;
      state.selectedSceneStitch[sceneId] = { [videoId]: videoId };
    },

    selectRandomVideosFromSubscenes: (state, action) => {
      const { sceneId } = action.payload;
      const movie = state.movies.find((m) => m.id === state.selectedMovie?.id);

      if (!movie || !movie.scenes) return;

      const scene = movie.scenes.find((s) => s.id === sceneId);
      if (!scene || !scene.subscenes) return;

      const newSelectedSubmissions = { ...state.selectedSubmissions };
      const newSelectedSceneStitch = { ...state.selectedSceneStitch };

      scene.subscenes.forEach((subscene) => {
        delete newSelectedSubmissions[subscene.id];
        delete newSelectedSceneStitch[subscene.id];
      });

      scene.subscenes.forEach((subscene) => {
        if (subscene.videos && subscene.videos.length > 0) {
          const randomIndex = Math.floor(
            Math.random() * subscene.videos.length
          );
          const randomVideo = subscene.videos[randomIndex];
          newSelectedSubmissions[subscene.id] = randomVideo.id;
          newSelectedSceneStitch[subscene.id] = {
            [randomVideo.id]: randomVideo,
          };
        }
      });

      state.selectedSubmissions = newSelectedSubmissions;
      state.selectedSceneStitch = newSelectedSceneStitch;
    },

    clearSelectedSceneStitch: (state, action) => {
      const sceneId = action.payload;
      const movie = state.movies.find((m) => m.id === state.selectedMovie?.id);
      if (movie && movie.scenes) {
        const scene = movie.scenes.find((s) => s.id === sceneId);
        if (scene && scene.subscenes) {
          scene.subscenes.forEach((subscene) => {
            delete state.selectedSceneStitch[subscene.id];
            delete state.selectedSubmissions[subscene.id];
          });
        }
      }
    },

    toggleVideoSelection: (state, action) => {
      const { video, subSceneId, movieType } = action.payload;
      if (movieType === "storytelling") {
        if (state.selectedSceneStitch?.[subSceneId]?.[video.id]) {
          delete state.selectedSceneStitch[subSceneId][video.id];
          if (Object.keys(state.selectedSceneStitch[subSceneId]).length === 0) {
            delete state.selectedSceneStitch[subSceneId];
          }
        } else {
          if (!state.selectedSceneStitch[subSceneId]) {
            state.selectedSceneStitch[subSceneId] = {};
          }
          state.selectedSceneStitch[subSceneId][video.id] = video;
        }
      } else {
        if (state.selectedSceneStitch?.[subSceneId]?.[video.id]) {
          delete state.selectedSceneStitch[subSceneId];
          if (Object.keys(state.selectedSceneStitch).length === 0) {
            state.selectedSceneStitch = {};
          }
        } else {
          state.selectedSceneStitch[subSceneId] = {
            [video.id]: video,
          };
        }
      }

      const updatedSubmissions = {};
      Object.keys(state.selectedSceneStitch).forEach((subSceneKey) => {
        const videoIds = Object.keys(state.selectedSceneStitch[subSceneKey]);
        if (videoIds.length > 0) {
          if (movieType === "storytelling") {
            updatedSubmissions[subSceneKey] = videoIds;
          } else {
            updatedSubmissions[subSceneKey] = videoIds[0];
          }
        }
      });

      state.selectedSubmissions = updatedSubmissions;
    },

    addVideoToMovie: (state, action) => {
      const { movieId, video } = action.payload;
      state.movies[movieId].videos.push(video);
    },

    toggleMovieStitchSelection: (state, action) => {
      const { movieId, video, movieType } = action.payload;

      if (movieType === "storytelling") {
        if (state.selectedMovieStitch?.[movieId]?.[video.id]) {
          delete state.selectedMovieStitch[movieId][video.id];
          if (Object.keys(state.selectedMovieStitch[movieId]).length === 0) {
            delete state.selectedMovieStitch[movieId];
          }
        } else {
          if (!state.selectedMovieStitch[movieId]) {
            state.selectedMovieStitch[movieId] = {};
          }
          state.selectedMovieStitch[movieId][video.id] = video;
        }
      } else {
        if (state.selectedMovieStitch?.[movieId]?.[video.id]) {
          delete state.selectedMovieStitch[movieId];
          if (Object.keys(state.selectedMovieStitch).length === 0) {
            state.selectedMovieStitch = {};
          }
        } else {
          state.selectedMovieStitch[movieId] = {
            [video.id]: video,
          };
        }
      }

      const updatedSubmissions = {};
      Object.keys(state.selectedMovieStitch).forEach((movieKey) => {
        const videoIds = Object.keys(state.selectedMovieStitch[movieKey]);
        if (videoIds.length > 0) {
          if (movieType === "storytelling") {
            updatedSubmissions[movieKey] = videoIds;
          } else {
            updatedSubmissions[movieKey] = videoIds[0];
          }
        }
      });

      state.selectedSubmissions = updatedSubmissions;
    },
    clearSelectedMovieStitch: (state, action) => {
      const movieId = action.payload;
      delete state.selectedMovieStitch[movieId];
    },

    setGeneratingMovie: (state, action) => {
      state.generatingMovie = action.payload;
    },
    setGeneratedMovie: (state, action) => {
      state.generatedMovie = action.payload;
    },
    setGenerateMovieError: (state, action) => {
      state.generateMovieError = action.payload;
    },
    clearGeneratedMovie: (state) => {
      state.generatedMovie = null;
      state.generateMovieError = null;
    },

    setUploading: (state, action) => {
      state.uploading = action.payload;
    },
    setUploadModalVisible: (state, action) => {
      state.uploadModalVisible = action.payload;
    },
    setCommentModalVisible: (state, action) => {
      state.commentModalVisible = action.payload;
    },
    setCurrentSubSceneId: (state, action) => {
      state.currentSubSceneId = action.payload;
    },
    setTempVideoKey: (state, action) => {
      state.tempVideoKey = action.payload;
    },
    resetUploadFlow: (state) => {
      state.uploading = false;
      state.uploadModalVisible = false;
      state.commentModalVisible = false;
      state.tempVideoKey = null;
      state.currentSubSceneId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMovies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMovies.fulfilled, (state, action) => {
        state.loading = false;
        state.movies = action.payload;
        state.error = null;
      })
      .addCase(fetchMovies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(generateMovie.pending, (state) => {
        state.generatingMovie = true;
        state.generateMovieError = null;
      })
      .addCase(generateMovie.fulfilled, (state, action) => {
        state.generatingMovie = false;
        state.generatedMovie = action.payload;
        state.generateMovieError = null;
      })
      .addCase(generateMovie.rejected, (state, action) => {
        state.generatingMovie = false;
        state.generateMovieError = action.payload;
      })
      .addCase(uploadVideo.pending, (state) => {
        state.uploading = true;
        state.uploadModalVisible = true;
      })
      .addCase(uploadVideo.fulfilled, (state) => {
        state.uploading = false;
        state.uploadModalVisible = false;
      })
      .addCase(uploadVideo.rejected, (state) => {
        state.uploading = false;
        state.uploadModalVisible = false;
      })
      .addCase(captureVideo.pending, (state) => {
        state.uploading = true;
        state.uploadModalVisible = true;
      })
      .addCase(captureVideo.fulfilled, (state) => {
        state.uploading = false;
        state.uploadModalVisible = false;
      })
      .addCase(captureVideo.rejected, (state) => {
        state.uploading = false;
        state.uploadModalVisible = false;
      });
  },
});

export const {
  setMovies,
  addVideoToMovie,
  setSelectedMovie,
  setSelectedSubScenes,
  setSelectedVideos,
  setAiMode,
  setVideoToPlay,
  clearVideoToPlay,
  setSelectModeScene,
  toggleVideoSelection,
  clearSelectedSceneStitch,
  toggleMovieStitchSelection,
  clearSelectedMovieStitch,
  setSelectedSubmissions,
  selectRandomVideosFromSubscenes,
  setGeneratingMovie,
  setGeneratedMovie,
  setGenerateMovieError,
  clearGeneratedMovie,
  setSelectedSceneStitch,
  setUploading,
  setUploadModalVisible,
  setCommentModalVisible,
  setCurrentSubSceneId,
  setTempVideoKey,
  resetUploadFlow,
} = movieSlice.actions;

// Auth slice
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    step: 1,
    resetToken: null,
    successMessage: null,
    errorMessage: null,
    isGuest: false,
  },
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    resetAuthResetState: (state) => {
      state.loading = false;
      state.step = 1;
      state.resetToken = null;
      state.successMessage = null;
      state.errorMessage = null;
    },
    setStep: (state, action) => {
      state.step = action.payload;
    },
    setErrorMessage: (state, action) => {
      state.errorMessage = action.payload;
    },
    clearError: (state) => {
      state.errorMessage = null;
    },
    setSuccessMessage: (state, action) => {
      state.successMessage = action.payload;
    },
    setGuestMode: (state) => {
      state.isGuest = true;
      state.isAuthenticated = false;
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      // Signup
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Check auth status cases
      .addCase(checkAuthStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = action.payload.isAuthenticated;
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      // Logout cases
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      })
      // requestResetOtp
      .addCase(requestResetOtp.pending, (state) => {
        state.loading = true;
        state.errorMessage = null;
        state.successMessage = null;
      })
      .addCase(requestResetOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload?.message || "OTP sent";
        state.step = 2;
      })
      .addCase(requestResetOtp.rejected, (state, action) => {
        state.loading = false;
        state.errorMessage =
          action.payload || action.error?.message || "Failed to send OTP";
      })

      // verifyResetOtp
      .addCase(verifyResetOtp.pending, (state) => {
        state.loading = true;
        state.errorMessage = null;
        state.successMessage = null;
      })
      .addCase(verifyResetOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.resetToken = action.payload.resetToken || null;
        state.successMessage = action.payload.message || "OTP verified";
        state.step = 3;
      })
      .addCase(verifyResetOtp.rejected, (state, action) => {
        state.loading = false;
        state.errorMessage =
          action.payload || action.error?.message || "OTP verify failed";
      })

      // resetPassword
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.errorMessage = null;
        state.successMessage = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message || "Password reset";
        state.step = 1;
        state.resetToken = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.errorMessage =
          action.payload || action.error?.message || "Reset failed";
      });
  },
});

export const {
  clearAuthError,
  resetAuthResetState,
  setStep,
  setErrorMessage,
  clearError,
  setSuccessMessage,
  setGuestMode,
} = authSlice.actions;

const store = configureStore({
  reducer: {
    movie: movieSlice.reducer,
    auth: authSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
