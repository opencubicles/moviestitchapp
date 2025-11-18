import { useSelector } from "react-redux";
import SceneSelectionScreen from "../../../src/components/screens/SceneSelectionScreen";
import UploadModal from "../../../src/components/screens/UploadModal";
import CommentModal from "../../../src/components/screens/CommentModal";
import VideoPlayerModal from "../../../src/components/screens/VideoPlayerModal";
import { View } from "react-native";
import { useDispatch } from "react-redux";
import { setCommentModalVisible } from "../../../src/store/index";

export default function Scenes() {
  const { uploadModalVisible, uploading, commentModalVisible } = useSelector(
    (state) => state.movie
  );
  const dispatch = useDispatch();
  return (
    <View style={{ flex: 1 }}>
      <SceneSelectionScreen />
      <UploadModal visible={uploadModalVisible} uploading={uploading} />
      <CommentModal
        visible={commentModalVisible}
        onClose={() => dispatch(setCommentModalVisible(false))}
      />
      <VideoPlayerModal />
    </View>
  );
}
