import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './Note.css';
// import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
// import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DoneIcon from '@mui/icons-material/Done';
import { accountForScroll } from '../utils';
import { useDispatch } from 'react-redux';
import {
  noteRemoved,
  noteMoved,
  noteTextUpdated,
  noteResized,
} from '../redux/notes/notesSlice';
import { NoteType } from '../redux/store';

interface NoteProps {
  note: NoteType;
  gridRef: any;
}

const Note = ({ note, gridRef }: NoteProps) => {
  const [preview, setPreview] = useState({
    x: note.x,
    y: note.y,
    width: note.width,
    height: note.height,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const dispatch = useDispatch();
  const handleDragStart = () => {
    console.log('dragging a note');
    if (isEditing) {
      return; //
    }
    setIsDragging(true);
  };

  const handleDrag = (x: number, y: number) => {
    console.log('dragging a note', { x, y });
    if (isEditing) {
      return; //
    }
    // account for width and height of the note
    // account for scroll using the accountForScroll function
    const { x: NewX, y: NewY } = accountForScroll(x - note.width / 2, y - note.height / 2, gridRef);
    
    if (preview.x !== NewX ||
      preview.y !== NewY) {
      setPreview({
        x: NewX,
        y: NewY,
        width: note.width,
        height: note.height,
      });
  }
  };

  const handleDragEnd = () => {
    if (isEditing) {
      return; //
    }
    setIsDragging(false);
    dispatch(noteMoved({ id: note.id, x: preview.x, y: preview.y }));
  };

  // renaming
  const handleTextUpdate = (newText: string) => {
    // Dispatch an action to update the text of the note
    dispatch(noteTextUpdated({ id: note.id, text: newText }));
  };

  // const handleToggleNoteVisibility = () => {
  //   // Toggle visibility of the note
  //   dispatch(noteVisibilityToggled(note.id));
  // };


  // resizing
  const handleResize = (x: number, y: number) => {
    if (isDragging) {
      return; //
    }

    const newWidth = note.width + x;
    const newHeight = note.height + y;
    setPreview({
      x: note.x,
      y: note.y,
      width: newWidth,
      height: newHeight,
    });
  };

  const handleResizeEnd = () => {
    if (isDragging) {
      return; //
    }
    setIsResizing(false);
    dispatch(noteResized({ id: note.id, width: preview.width, height: preview.height }));

    
  };
  
 

 

  return (
    <React.Fragment>
    {(isDragging || isResizing) &&
      (
        <>
          <div
            className={`note note-${note.id}`}
            style={{
              left: `${preview.x}px`,
              top: `${preview.y}px`,
            }}
          >
            <div 
            className={'note-text'}
              style={{
                border: '1px dashed gray',
                opacity: 0.5,
                width: `${preview.width}px`,
                height: `${preview.height}px`,
              }}
            >
              {note.text}
              </div>

          </div>
        </>
      )}
      <motion.div
        className={`note note-${note.id}`}
        style={{
          left: `${note.x}px`,
          top: `${note.y}px`,
        }}
        drag
        dragMomentum={false}
        
        onPointerDown={(event) => {
          event.stopPropagation();
          
        }}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0}
        onDragStart={() => handleDragStart()}
        onDragEnd={() => handleDragEnd()}
        onDrag={(_, info) => {
            handleDrag(info.point.x, info.point.y);
        }}
      >
       { 
       <motion.div 
       className={'note-options'}

       >
       <button

        className="button note-edit"
        onClick={() => {
            setIsEditing(!isEditing);
        }
        }
        >
            {isEditing ? <DoneIcon /> : <EditIcon />}
        </button>
          <button
                    className="button note-delete"
                    onClick={() => {
                        dispatch(noteRemoved({ id: note.id }));
                    }
                    }
                    >
                        <DeleteIcon />
                    </button>
         
                    </motion.div>}
        
        { isEditing &&
          <div 
        className='note-resize-container'
        >
        <motion.div
          className={'note-drag-corner'}
          style={
            {
              position: 'absolute',
              right: 10,
              bottom: 10,
              width: '1em',
              height: '1em',
              cursor: 'se-resize',
              backgroundColor: 'gray',
              border: '1px solid white',
            }
          }
          drag
          dragMomentum={false}
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0}
          onDragStart={() => {
            setIsResizing(true);
          }}
          onDragEnd={() => {
            handleResizeEnd();
          }}
          onDrag={(_, info) => {
            handleResize(info.offset.x, info.offset.y);
          }}
          
        >
        </motion.div>
          
        </div>}
          {isEditing ? (
              <textarea
              
                className={'note-input'}
                style={
                  {
                    width: `${note.width}px`,
                    height: `${note.height}px`,
                  }
                }
                value={note.text}
                onChange={(e) => handleTextUpdate(e.target.value)}
                onBlur={() => 
                  {
                    setIsEditing(false);
                  }
                }
                autoFocus
                autoSave='true'
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {

                    setIsEditing(false);
                    
                  }
                }}
              />
              // {/* <button
              //   onPointerDown={() => {
              //     handleToggleNoteVisibility();
              //   }}
              //   className={'visibility-button'}
              // >
              //   {note.visibility ? <VisibilityIcon /> : <VisibilityOffIcon />}
              // </button> */}
          ) : (
            note.visibility ? (
              <motion.div 
              layout="position"
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 25,
              }}
              className={'note-text'}
              style={{
                width: `${note.width}px`,
                height: `${note.height}px`,
              }}
              >
                {note.text}
              </motion.div>
            )
            : null
          )}

      </motion.div>
      </React.Fragment>
  );
}


const MemoizedNote = React.memo(Note, (prevProps, nextProps) => {
  const shouldRerender = prevProps.note.x !== nextProps.note.x ||
    prevProps.note.y !== nextProps.note.y ||
    prevProps.note.text !== nextProps.note.text ||
    prevProps.note.width !== nextProps.note.width ||
    prevProps.note.height !== nextProps.note.height ||
    prevProps.note.visibility !== nextProps.note.visibility ||
    prevProps.gridRef !== nextProps.gridRef;
    
  if (shouldRerender) {
    console.log('Re-rendering due to change in props:', { prevProps, nextProps });
  }
  return !shouldRerender;
});
export default MemoizedNote;