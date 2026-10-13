import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, SyntheticEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Upload, X } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { getAdminPhoto, uploadRecaps, deleteRecap, generateVariantPreview } from '../../services/api';

interface Recap {
  id: number;
  variant_number?: number;
  url?: string;
  file_path?: string;
}

interface Photo {
  startNo?: string | number;
  start_no?: string | number;
  url?: string;
  variantPreviewUrl?: string;
  recaps?: Recap[];
}

interface Progress {
  current: number;
  total: number;
  success: number;
  failed: number;
}

const initialProgress: Progress = { current: 0, total: 0, success: 0, failed: 0 };

function basename(path?: string): string {
  if (!path) return '-';
  const clean = path.split('?')[0];
  const parts = clean.split('/');
  return parts[parts.length - 1] || clean;
}

function recapSrc(recap: Recap): string {
  if (recap.url && recap.url.startsWith('http')) return recap.url;
  const base = import.meta.env.VITE_API_URL || '';
  return `${base}/uploads/recaps/${recap.file_path ?? ''}`;
}

function hideImg(e: SyntheticEvent<HTMLImageElement>): void {
  e.currentTarget.style.display = 'none';
}

export default function RecapUpload() {
  const { id } = useParams();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<Progress>(initialProgress);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchPhoto = async (): Promise<void> => {
    try {
      const res = await getAdminPhoto(id);
      setPhoto(res.data as Photo);
    } catch (error) {
      console.error('Error fetching photo:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhoto();
  }, [id]);

  const handleFilesSelected = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;

    setUploading(true);
    setProgress({ current: 0, total: files.length, success: 0, failed: 0 });

    let success = 0;
    let failed = 0;
    for (let i = 0; i < files.length; i++) {
      try {
        const formData = new FormData();
        formData.append('recaps', files[i]);
        await uploadRecaps(id, formData);
        success++;
      } catch (error) {
        console.error(`Error uploading file ${i + 1}:`, error);
        failed++;
      }
      setProgress({ current: i + 1, total: files.length, success, failed });
    }

    await fetchPhoto();
    setUploading(false);
    setProgress(initialProgress);
  };

  const handleGeneratePreview = async (): Promise<void> => {
    setGenerating(true);
    try {
      await generateVariantPreview(id);
      await fetchPhoto();
    } catch (error) {
      console.error('Error generating variant preview:', error);
      alert('Gagal membuat preview');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteExisting = async (recapId: number): Promise<void> => {
    if (confirm('Hapus recap foto ini?')) {
      try {
        await deleteRecap(recapId);
        await fetchPhoto();
      } catch (error) {
        console.error('Error deleting recap:', error);
      }
    }
  };

  if (loading || !photo) {
    return (
      <AdminLayout title="Upload Recap">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <div className="spinner"></div>
        </div>
      </AdminLayout>
    );
  }

  const variantCount: number = photo.recaps?.length ?? 0;
  const headerSrc = photo.variantPreviewUrl || photo.url || '';
  const attempt = Math.min(progress.current + 1, progress.total);
  const pct = progress.total > 0 ? Math.round((attempt / progress.total) * 100) : 0;

  return (
    <AdminLayout title={`Upload Recap #${photo.startNo ?? photo.start_no}`}>
      <Link
        to="/admin/recap"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'rgba(255,255,255,0.4)',
          textDecoration: 'none',
          marginBottom: '1.5rem',
          fontSize: '0.875rem'
        }}
      >
        <ArrowLeft size={16} /> Kembali ke Daftar Recap
      </Link>

      <div style={{
        background: '#0a0a0a',
        borderRadius: '16px',
        padding: '1.5rem',
        border: '1px solid rgba(255,255,255,0.05)',
        marginBottom: '2rem',
        display: 'flex',
        gap: '1.5rem',
        alignItems: 'flex-start'
      }}>
        {headerSrc ? (
          <img
            src={headerSrc}
            alt={`Start #${photo.startNo ?? photo.start_no}`}
            onError={hideImg}
            style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '12px', background: '#111' }}
          />
        ) : null}
        <div>
          <p style={{ color: '#39FF14', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
            Foto Preview
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: '900', fontStyle: 'italic', marginBottom: '0.5rem' }}>
            #{photo.startNo ?? photo.start_no}
          </p>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>
            {variantCount} varian sudah diupload
          </p>
        </div>
      </div>

      <div style={{
        background: '#0a0a0a',
        borderRadius: '16px',
        padding: '1.5rem',
        border: '1px solid rgba(255,255,255,0.05)',
        marginBottom: '2rem'
      }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: '900', textTransform: 'uppercase', color: '#39FF14', letterSpacing: '0.1em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Upload size={16} /> Upload Foto Varian
        </h3>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFilesSelected}
          accept="image/*"
          multiple
          disabled={uploading}
          style={{ display: 'none' }}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            width: '100%',
            padding: '2rem',
            border: '2px dashed rgba(255,255,255,0.2)',
            borderRadius: '12px',
            background: 'transparent',
            color: 'rgba(255,255,255,0.4)',
            cursor: uploading ? 'not-allowed' : 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: uploading ? '1.5rem' : 0
          }}
        >
          <Upload size={32} />
          <span>{uploading ? 'Mengupload...' : 'Klik untuk pilih foto (bisa multiple)'}</span>
        </button>

        {uploading && (
          <div style={{
            padding: '1rem',
            background: 'rgba(57,255,20,0.1)',
            border: '1px solid rgba(57,255,20,0.3)',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#39FF14', fontWeight: '700', fontSize: '0.875rem', margin: '0 0 0.75rem 0' }}>
              Mengupload foto {attempt} dari {progress.total} ({pct}%)
            </p>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: '#39FF14', borderRadius: '4px', transition: 'width 0.3s ease' }} />
            </div>
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', margin: '0 0 0.25rem 0' }}>
              {progress.current}/{progress.total} selesai • {progress.success} berhasil • {progress.failed} gagal
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', margin: 0 }}>
              Mohon tunggu, jangan tutup halaman ini
            </p>
          </div>
        )}
      </div>

      {!uploading && variantCount > 0 && (
        <div style={{
          background: '#0a0a0a',
          borderRadius: '16px',
          padding: '1.5rem',
          border: '1px solid rgba(57,255,20,0.2)',
          marginBottom: '2rem'
        }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: '900', textTransform: 'uppercase', color: '#39FF14', letterSpacing: '0.1em', marginBottom: '1rem' }}>
            Preview Otomatis (dari varian)
          </h3>

          {photo.variantPreviewUrl ? (
            <>
              <img
                src={photo.variantPreviewUrl}
                alt="Preview otomatis"
                onError={hideImg}
                style={{ width: '100%', maxWidth: '600px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <button
                onClick={handleGeneratePreview}
                disabled={generating}
                style={{
                  marginTop: '1rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'transparent',
                  color: '#39FF14',
                  border: '2px solid #39FF14',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '12px',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  cursor: generating ? 'not-allowed' : 'pointer',
                  opacity: generating ? 0.5 : 1
                }}
              >
                {generating ? 'Membuat...' : 'Perbarui Preview'}
              </button>
            </>
          ) : (
            <button
              onClick={handleGeneratePreview}
              disabled={generating}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                background: '#39FF14',
                color: 'black',
                padding: '1rem',
                borderRadius: '12px',
                fontWeight: '900',
                textTransform: 'uppercase',
                fontStyle: 'italic',
                border: 'none',
                cursor: generating ? 'not-allowed' : 'pointer',
                opacity: generating ? 0.5 : 1
              }}
            >
              {generating ? 'Membuat Preview...' : 'Selesai dan Buat Preview'}
            </button>
          )}
        </div>
      )}

      {variantCount > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: '900', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', marginBottom: '1rem' }}>
            Varian Tersimpan ({variantCount})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
            {photo.recaps?.map((recap, index) => {
              const variantNumber = recap.variant_number ?? index + 1;
              return (
                <div key={recap.id} style={{ position: 'relative' }}>
                  <img
                    src={recapSrc(recap)}
                    onError={hideImg}
                    alt={`Varian ${variantNumber}`}
                    style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: '#111' }}
                  />
                  <div style={{
                    position: 'absolute', top: '0.5rem', left: '0.5rem',
                    background: '#39FF14', color: 'black',
                    fontSize: '0.75rem', fontWeight: '900',
                    padding: '0.25rem 0.5rem', borderRadius: '4px'
                  }}>
                    Varian {variantNumber}
                  </div>
                  <button
                    onClick={() => handleDeleteExisting(recap.id)}
                    aria-label={`Hapus varian ${variantNumber}`}
                    style={{
                      position: 'absolute', top: '0.5rem', right: '0.5rem',
                      background: 'rgba(239,68,68,0.8)', border: 'none',
                      color: 'white', padding: '0.25rem',
                      borderRadius: '4px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    <X size={14} />
                  </button>
                  <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', margin: '0.5rem 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    #{variantNumber} • {basename(recap.file_path ?? recap.url)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
