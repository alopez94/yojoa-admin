import { useState, useEffect, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';


export default function PhotosPage() {

  const { establishmentData } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [coverImage, setCoverImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!establishmentData) return;
    setPhotos(establishmentData.photos || []);
    setCoverImage(establishmentData.coverImage || '');
  }, [establishmentData])

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    //file validations

    if (photos.length + files.length > 20) {
      setError('Maximo 20 fotos permitidas');
      return;
    }

    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Solo se permiten los siguiente formatos: JPG, PNG o WebP');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Cada Imagen debe ser menor a 5MB')
        return;
      }
    }

    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {

      const uploadedUrls = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
        const storageRef = ref(
          storage,
          `establishments/${establishmentData.id}/photos/${fileName}`
        );

        await new Promise((resolve, reject) => {
          const uploadTask = uploadBytesResumable(storageRef, file);
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = ((i / files.length) + (snapshot.bytesTransferred / snapshot.totalBytes / files.length)) * 100;
              setUploadProgress(Math.round(progress));
            },
            reject,
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              uploadedUrls.push(url);
              resolve();
            }
          )
        })

      }

      const newPhotos = [...photos, ...uploadedUrls];
      const newCover = coverImage || uploadedUrls[0];

      //save to firestore
      await updateDoc(doc(db, 'establishments', establishmentData.id),
        {
          photos: newPhotos,
          coverImage: newCover,
          updatedAt: serverTimestamp(),
        });

      setPhotos(newPhotos);
      setCoverImage(newCover);
      setSuccess(`${uploadedUrls.length} foto(s) subida(s) correctamente`);
      setTimeout(() => setSuccess(null), 3000);


    }
    catch (error) {
      console.log('Error uploading images: ', error);
      setError("Error al subir imagenes, intenta de nuevo.");
    }
    finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }

  }

  const handleSetCover = async (url) => {
    try {
      await updateDoc(doc(db, 'establishments', establishmentData.id), {
        coverImage: url,
        updatedAt: serverTimestamp(),
      });
      setCoverImage(url);
      setSuccess('Foto de portada actualizada');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Error al actualizar la portada');
    }
  };

  const handleDelete = async (url) => {
    try {
      // Delete from Storage
      const storageRef = ref(storage, url);
      await deleteObject(storageRef);

      const newPhotos = photos.filter(p => p !== url);
      const newCover = coverImage === url ? (newPhotos[0] || '') : coverImage;

      // Update Firestore
      await updateDoc(doc(db, 'establishments', establishmentData.id), {
        photos: newPhotos,
        coverImage: newCover,
        updatedAt: serverTimestamp(),
      });

      setPhotos(newPhotos);
      setCoverImage(newCover);
      setSuccess('Foto eliminada');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Delete error:', err);
      setError('Error al eliminar la foto');
    }
  };

  return (
    <div className='p-8 max-w-5x1'>


      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Fotos</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Sube fotos de tu establecimiento · Máx. 20 fotos · 5MB por imagen
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || photos.length >= 20}
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          + Subir fotos
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Alerts */}
      {error && (
        <div className='bg-red-50 border-1-4 border-red-500 text-red-700 text-sm p-3 rounded mb-5'>
          {error}
        </div>
      )}
      {success && (
        <div className='bg-green-50 border-1-4 border-green-500 text-green-700 text-sm p-3 rounded mb-5'>
          {success}
        </div>
      )}

      {uploading && (
        <div className='bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-sm text-blue-700 font-mediun'>Subiendo fotos...</span>
            <span className='text-sm text-blue-700'>{uploadProgress}</span>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {coverImage && (
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-2">Foto de portada</p>
          <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200">
            <img src={coverImage} alt="Portada"
              className="w-full h-full object-cover" />
            <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full">
              Portada
            </div>
          </div>
        </div>
      )}

      {/* Photos grid */}
      {photos.length === 0 && !uploading ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl py-16 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          <p className="text-4xl mb-3">📷</p>
          <p className="text-gray-500 font-medium">Haz clic para subir fotos</p>
          <p className="text-gray-400 text-sm mt-1">JPG, PNG o WEBP · Máx. 5MB por imagen</p>
        </div>
      ) : (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">
            Todas las fotos ({photos.length}/20)
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((url, index) => (
              <div key={url} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-square">
                <img src={url} alt={`Foto ${index + 1}`}
                  className="w-full h-full object-cover" />

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  {coverImage !== url && (
                    <button
                      onClick={() => handleSetCover(url)}
                      className="bg-white text-gray-800 text-xs font-medium px-2 py-1 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
                    >
                      Portada
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(url)}
                    className="bg-white text-red-600 text-xs font-medium px-2 py-1 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
                  >
                    Eliminar
                  </button>
                </div>

                {/* Cover badge */}
                {coverImage === url && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                    Portada
                  </div>
                )}
              </div>
            ))}

            {/* Add more */}
            {photos.length < 20 && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <p className="text-2xl text-gray-400">+</p>
                <p className="text-xs text-gray-400 mt-1">Agregar</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}