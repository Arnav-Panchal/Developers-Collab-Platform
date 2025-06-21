// import ProjectList from "./ProjectList"
// import Recommendations from "../flask/recommendations";

// import ChatRoom from "../components/chatroom";
import ProjectRecommendations from "../flask m/ProjectRecommendations";
// import Collaboration from "./Collaboration";
import ProjectList from "./ProjectList";
// import TeammateRecommendations from "../flask m/TeammateRecommendations";



const Discover = () => {

  return (
    <div>
      {/* <ChatRoom/> */}
      <ProjectList/>
      {/* <Collaboration/> */}
      <ProjectRecommendations/>
      {/* <TeammateRecommendations postId={postId}/> */}
      {/* <Recommendations /> */}
    </div>
  )
}

export default Discover