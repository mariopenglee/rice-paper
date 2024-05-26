// NewMap.jsx
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

//const BACKEND_URL = 'http://0.0.0.0:3000';
const BACKEND_URL = 'https://starfish-app-qe9pj.ondigitalocean.app';
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
