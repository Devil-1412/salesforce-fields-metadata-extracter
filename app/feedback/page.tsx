'use client';

import { Alert, Box, Button, Container, Group, Loader, SimpleGrid, Stack } from '@mantine/core';
import { IconSparkles } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import useUserAuthStore from '../../lib/store/userAuthStore';
import { FeedbackCard } from './components/FeedbackCard';
import { FeedbackFilters } from './components/FeedbackFilters';
import { FeedbackHeader } from './components/FeedbackHeader';
import { FeedbackSubmitModal } from './components/FeedbackSubmitModal';
import { ImageCarouselModal } from './components/ImageCarouselModal';

import '@mantine/carousel/styles.css';

// Types
interface Report {
  id: string;
  type: 'bug' | 'feature_request' | 'suggestion';
  title: string;
  description: string;
  images: string[];
  status: 'pending' | 'solved' | 'dismissed';
  created_at: string;
}

export default function FeedbackPage() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useUserAuthStore();

  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState('all');

  // Image Modal State
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedReportImages, setSelectedReportImages] = useState<string[]>([]);
  const [initialSlide, setInitialSlide] = useState(0);

  const isAdmin = profile?.role === 'admin';
  const loading = reportsLoading; // Auth loading is handled by store persistence

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<string | null>('feature_request');
  const [images, setImages] = useState<File[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Initial Sync
  useEffect(() => {
    refreshProfile();
    fetchReports();
  }, []);

  const fetchReports = async (nextCursor: string | null = null) => {
    setReportsLoading(true);
    try {
      let url = '/api/reports?limit=20';
      if (nextCursor) {
        url += `&cursor=${nextCursor}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        if (nextCursor) {
          setReports((prev) => [...prev, ...data.reports]);
        } else {
          setReports(data.reports);
        }

        if (data.reports.length === 20) {
          setHasMore(true);
          setCursor(data.reports[data.reports.length - 1].created_at);
        } else {
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load reports');
    } finally {
      setReportsLoading(false);
    }
  };

  const loadMore = () => {
    if (cursor) {
      fetchReports(cursor);
    }
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      try {
        // 1. Get Signed Upload URL from API (Authenticated via Cookie)
        const res = await fetch('/api/reports/upload-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name }),
        });
        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to get upload URL');
        }

        // 2. Upload to Signed URL using standard fetch (PUT)
        const uploadRes = await fetch(data.signedUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadRes.ok) {
          throw new Error(`Upload failed: ${uploadRes.statusText}`);
        }

        // 3. Use returned Public URL
        urls.push(data.publicUrl);
      } catch (err) {
        console.error('Upload failed for file:', file.name, err);
        toast.error(`Failed to upload ${file.name}`);
        throw err;
      }
    }
    return urls;
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (title.length < 5) errors.title = 'Title too short';
    if (description.length < 10) errors.description = 'Description too short';
    if (images.length > 5) errors.images = 'Max 5 images allowed';
    if (!type) errors.type = 'Type is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (!user) {
      toast.error('You must be logged in to submit feedback');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading('Submitting feedback...');

    try {
      // 1. Upload images
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadImages(images);
      }

      // 2. Submit API
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          type,
          images: imageUrls,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Feedback submitted!', { id: toastId });
        setSubmitModalOpen(false);
        // Reset form
        setTitle('');
        setDescription('');
        setImages([]);
        setType('feature_request');
        fetchReports(); // Refresh list
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to submit', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/reports', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportId: id, status }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Report marked as ${status}`);
        // Optimistic update
        setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: status as any } : r)));
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleImageClick = (images: string[], index: number) => {
    setSelectedReportImages(images);
    setInitialSlide(index);
    setImageModalOpen(true);
  };

  const filteredReports = reports.filter((r) => {
    if (filter === 'all') return true;
    return r.type === filter;
  });

  return (
    <Box bg="gray.0" mih="100vh">
      <FeedbackHeader onSubmitClick={() => setSubmitModalOpen(true)} />

      <Container size="xl" py="xl" mt={-30}>
        <FeedbackFilters filter={filter} setFilter={setFilter} />

        {loading ? (
          <Stack align="center" py={50}>
            <Loader size="xl" type="dots" />
          </Stack>
        ) : (
          <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
            {filteredReports.map((report) => (
              <FeedbackCard
                key={report.id}
                report={report}
                isAdmin={isAdmin}
                onStatusUpdate={handleStatusUpdate}
                onImageClick={handleImageClick}
              />
            ))}
          </SimpleGrid>
        )}

        {hasMore && !loading && (
          <Group justify="center" mt={40}>
            <Button variant="default" onClick={loadMore} size="md">
              Load More Feedback
            </Button>
          </Group>
        )}

        {!loading && filteredReports.length === 0 && (
          <Container size="sm">
            <Alert
              icon={<IconSparkles size={16} />}
              title="No feedback found"
              color="blue"
              variant="light"
            >
              {filter === 'all'
                ? 'Be the first to share your thoughts!'
                : `No ${filter.replace('_', ' ')}s found. Submit one now!`}
            </Alert>
          </Container>
        )}
      </Container>

      <FeedbackSubmitModal
        opened={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
        type={type}
        setType={setType}
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
        images={images}
        setImages={setImages}
        formErrors={formErrors}
      />

      <ImageCarouselModal
        opened={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        images={selectedReportImages}
        initialSlide={initialSlide}
      />
    </Box>
  );
}
