import { Carousel } from '@mantine/carousel';
import { Image, Modal } from '@mantine/core';

interface ImageCarouselModalProps {
  opened: boolean;
  onClose: () => void;
  images: string[];
  initialSlide: number;
}

export function ImageCarouselModal({
  opened,
  onClose,
  images,
  initialSlide,
}: ImageCarouselModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      centered
      withCloseButton={false}
      padding={0}
      styles={{
        body: {
          backgroundColor: 'transparent',
        },
        content: {
          backgroundColor: 'transparent',
          boxShadow: 'none',
        },
      }}
    >
      <Carousel
        initialSlide={initialSlide}
        withIndicators
        height="80vh"
        style={{ flex: 1, alignItems: 'center' }}
        slideSize="100%"
      >
        {images.map((img, index) => (
          <Carousel.Slide key={index}>
            <Image
              src={img}
              h="100%"
              w="auto"
              fit="contain"
              style={{ margin: '0 auto', maxHeight: '80vh' }}
            />
          </Carousel.Slide>
        ))}
      </Carousel>
    </Modal>
  );
}
