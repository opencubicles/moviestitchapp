import AsyncStorage from "@react-native-async-storage/async-storage";
export const MOVIE_STITCH_API_BASE_URL = "https://api.moviestitch.com/api";
const BASE_MEDIA_URL =
  "https://ms-videos-destination920a3c57-oew53evf0tuj.s3.us-west-1.amazonaws.com/";

export const movieStitchApi = {
  MOVIE_STITCH_API_BASE_URL,
  async fetchScripts() {
    try {
      const response = await fetch(`${MOVIE_STITCH_API_BASE_URL}/load_scripts`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching scripts:", error);
      throw error;
    }
  },

  async getPresignedUrls(videoFilename) {
    const token = await AsyncStorage.getItem("authToken");
    try {
      const response = await fetch(
        `${MOVIE_STITCH_API_BASE_URL}/user-submissions-presigned-url`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            videoFilename: videoFilename,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  async generateMovie(selectedVideos) {
    try {
      const response = await fetch(
        `${MOVIE_STITCH_API_BASE_URL}/generate-movie/1`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            selectedVideos: selectedVideos,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error generating movie:", error);
      throw error;
    }
  },
  async generateMovieMp4(selectedVideos) {
    try {
      const response = await fetch(
        `${MOVIE_STITCH_API_BASE_URL}/generate-new-movie-mp4`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            selectedVideos: selectedVideos,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error generating movie:", error);
      throw error;
    }
  },

  async addUserSubmission(submissionData) {
    const token = await AsyncStorage.getItem("authToken");
    try {
      const response = await fetch(
        `${MOVIE_STITCH_API_BASE_URL}/user-submissions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(submissionData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  // Transform API data to match the expected structure
  transformApiData(apiData) {
    const ensureUrl = (fileKey) => {
      if (!fileKey) return null;

      const firstHttp = fileKey.indexOf("https://");
      const secondHttp = fileKey.indexOf("https://", firstHttp + 1);
      if (secondHttp !== -1) {
        fileKey = fileKey.substring(secondHttp);
      }

      if (/^https?:\/\//i.test(fileKey)) {
        return fileKey;
      }

      return `${BASE_MEDIA_URL}${fileKey}`;
    };

    return apiData.map((script, index) => {
      const scenes = (script.main_sets || []).map((mainSet, mainSetIndex) => {
        const subscenes = (mainSet.sets || []).map((set, setIndex) => {
          const videos = (set.submissions || []).map(
            (submission, submissionIndex) => ({
              id: `${submission.id || `${set.id}_${submissionIndex + 1}`}`,
              name: submission.comment || `Video ${submissionIndex + 1}`,
              thumbnail:
                ensureUrl(submission.thumbnail_file_key) ||
                "https://images.pexels.com/photos/7319480/pexels-photo-7319480.jpeg",
              videoUrl:
                ensureUrl(submission.video_file_key) ||
                "https://cdn.pixabay.com/video/2022/01/23/105438-670487243_large.mp4",
              submissionId: submission.id,
              userId: submission.user_id,
              awsJobId: submission.aws_job_id,
              awsJobStatus: submission.aws_job_status,
              createdAt: submission.created_at,
              updatedAt: submission.updated_at,
            })
          );

          return {
            id: `${set.id || `${mainSet.id}_${setIndex + 1}`}`,
            name: set.title || `Subscene ${setIndex + 1}`,
            thumbnail:
              ensureUrl(set.thumbnail_file_key) ||
              "https://images.pexels.com/photos/3062545/pexels-photo-3062545.jpeg",
            videoUrl:
              ensureUrl(set.video_file_key) ||
              "https://cdn.pixabay.com/video/2022/01/23/105438-670487243_large.mp4",
            setId: set.id,
            awsJobId: set.aws_job_id,
            awsJobStatus: set.aws_job_status,
            imageFileKey: ensureUrl(set.image_file_key),
            pdfFileKey: ensureUrl(set.pdf_file_key),
            createdAt: set.created_at,
            updatedAt: set.updated_at,
            start_time: set.start_time || 0,
            end_time: set.end_time || null,
            videos: videos.length > 0 ? videos : [],
          };
        });

        return {
          id: `${mainSet.id || `${script.id}_${mainSetIndex + 1}`}`,
          title: mainSet.name || `Scene ${mainSetIndex + 1}`,
          thumbnail:
            ensureUrl(mainSet.thumbnail_file_key) ||
            "https://images.pexels.com/photos/3062545/pexels-photo-3062545.jpeg",
          videoUrl:
            ensureUrl(mainSet.video_file_key) ||
            "https://cdn.pixabay.com/video/2022/01/23/105438-670487243_large.mp4",
          imageFile:
            ensureUrl(mainSet.image_file_key) ||
            "https://images.pexels.com/photos/3062545/pexels-photo-3062545.jpeg",
          pdfFileKey: ensureUrl(mainSet.pdf_file_key),
          mainSetId: mainSet.id,
          scriptId: mainSet.script_id,
          createdAt: mainSet.created_at,
          updatedAt: mainSet.updated_at,
          start_time: mainSet.start_time || 0,
          end_time: mainSet.end_time || null,
          subscenes: subscenes.length > 0 ? subscenes : [],
        };
      });

      return {
        id: `m${script.id || index + 1}`,
        title: script.title || "Untitled Movie",
        thumbnail:
          ensureUrl(script.image_file_key) ||
          "https://images.pexels.com/photos/275977/pexels-photo-275977.jpeg",
        description: script.description || "",
        status: script.status || "published",
        type: script.type || "movies",
        pdfFileKey: ensureUrl(script.pdf_file_key),
        createdAt: script.created_at,
        updatedAt: script.updated_at,
        videoFileKey: ensureUrl(script.video_file_key),
        mainSets: script.main_sets || [],
        scenes: scenes.length > 0 ? scenes : [],
      };
    });
  },
};
