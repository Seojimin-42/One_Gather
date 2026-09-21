import AI_Character from "../assets/ai/AI_character.png";
import "../styles/AI_Assistant.css";

const AI_Assistant = () => {
    return (
        <div className="ai-assistant">
            <button className="ai-character-button">
                <img src={AI_Character} alt="AI Assistant" />
            </button>
        </div>
    );
};

export default AI_Assistant