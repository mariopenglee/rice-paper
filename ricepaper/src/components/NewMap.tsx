// NewMap.jsx
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
//const BACKEND_URL = 'https://rice-paper-backend.vercel.app';
//const BACKEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'https://ricepaper-backend.adaptable.app';
const NewMap = () => {
  const navigate = useNavigate();

  const createNewMap = async () => {
    try {
      const response = await axios.post(BACKEND_URL + '/api/newmap');
      const { mapId } = response.data;
      navigate(`/map/${mapId}`);
    } catch (error) {
      console.error('Could not create new map', error);
    }
  };

  return (
    <div>
      <h1>Create a New Map</h1>
      <button onClick={createNewMap}>Create New Map</button>
    </div>
  );
};

export default NewMap;
