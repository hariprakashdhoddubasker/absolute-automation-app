// tests/repositories/whatsappMessageQueueRepository.test.js

const whatsappMessageQueueRepository = require('../../src/repositories/whatsappMessageQueueRepository');
const db = require('../../src/config/db');
const logger = require('../../src/utils/logger');

// Mock the getConnection method from the db module
jest.mock('../../src/config/db');

describe('whatsappMessageQueueRepository', () => {
  let mockConnection;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a mock connection object
    mockConnection = {
      query: jest.fn(),
      release: jest.fn(),
    };

    // Mock getConnection to return the mock connection
    db.getConnection.mockResolvedValue(mockConnection);

    // Mock console methods if needed
    logger.info = jest.fn();
    handleError = jest.fn();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('insertQueueEntries', () => {
    it('should insert queue entries successfully', async () => {
      // Arrange
      const entries = [
        {
          name: 'John Doe',
          phone: '1234567890',
          message: 'Hello, World!',
          media_url: null,
          filename: null,
          status: 'pending',
        },
        {
          name: 'Jane Smith',
          phone: '0987654321',
          message: 'Test message',
          media_url: 'http://example.com/image.jpg',
          filename: 'image.jpg',
          status: 'pending',
        },
      ];

      mockConnection.query.mockResolvedValue();

      // Act
      await whatsappMessageQueueRepository.insertQueueEntries(entries);

      // Assert
      expect(db.getConnection).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalledWith(
        'INSERT INTO whatsapp_message_queue (name, phone, message, media_url, filename, status) VALUES ?',
        [
          [
            [
              entries[0].name,
              entries[0].phone,
              entries[0].message,
              entries[0].media_url,
              entries[0].filename,
              entries[0].status,
            ],
            [
              entries[1].name,
              entries[1].phone,
              entries[1].message,
              entries[1].media_url,
              entries[1].filename,
              entries[1].status,
            ],
          ],
        ]
      );
      expect(logger.info).toHaveBeenCalledWith('Queue entries inserted successfully.');
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should log a message if no entries to insert', async () => {
      // Arrange
      const entries = [];

      // Act
      await whatsappMessageQueueRepository.insertQueueEntries(entries);

      // Assert
      expect(db.getConnection).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('No entries to insert.');
    });

    it('should handle errors when inserting queue entries', async () => {
      // Arrange
      const entries = [
        {
          name: 'John Doe',
          phone: '1234567890',
          message: 'Hello, World!',
          media_url: null,
          filename: null,
          status: 'pending',
        },
      ];

      const mockError = new Error('Database error');
      mockConnection.query.mockRejectedValue(mockError);

      // Act & Assert
      await expect(whatsappMessageQueueRepository.insertQueueEntries(entries)).rejects.toThrow(
        mockError
      );

      expect(db.getConnection).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalled();
      expect(await handleError).toHaveBeenCalledWith(
        '[insertQueueEntries] Error inserting queue entries:',
        mockError
      );
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('getPendingMessages', () => {
    it('should fetch pending messages successfully', async () => {
      // Arrange
      const limit = 10;
      const mockRows = [
        {
          id: 1,
          name: 'John Doe',
          phone: '1234567890',
          message: 'Hello, World!',
          media_url: null,
          filename: null,
          status: 'pending',
          created_at: '2023-09-15 12:00:00',
        },
      ];
      mockConnection.query.mockResolvedValue([mockRows]);

      // Act
      const result = await whatsappMessageQueueRepository.getPendingMessages(limit);

      // Assert
      expect(db.getConnection).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalledWith(expect.any(String), [limit]);
      expect(result).toEqual(mockRows);
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should handle errors when fetching pending messages', async () => {
      // Arrange
      const limit = 10;
      const mockError = new Error('Database error');
      mockConnection.query.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        whatsappMessageQueueRepository.getPendingMessages(limit)
      ).rejects.toThrow(mockError);

      expect(db.getConnection).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalledWith(expect.any(String), [limit]);
      expect(await handleError).toHaveBeenCalledWith(
        '[getPendingMessages] Error fetching pending messages:',
        mockError
      );
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('deleteMessageFromQueue', () => {
    it('should delete a message from the queue successfully', async () => {
      // Arrange
      const id = 1;
      mockConnection.query.mockResolvedValue();

      // Act
      await whatsappMessageQueueRepository.deleteMessageFromQueue(id);

      // Assert
      expect(db.getConnection).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalledWith(
        'DELETE FROM whatsapp_message_queue WHERE id = ?',
        [id]
      );
      expect(logger.info).toHaveBeenCalledWith(`Message with ID ${id} deleted from queue.`);
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should handle errors when deleting a message from the queue', async () => {
      // Arrange
      const id = 1;
      const mockError = new Error('Database error');
      mockConnection.query.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        whatsappMessageQueueRepository.deleteMessageFromQueue(id)
      ).rejects.toThrow(mockError);

      expect(db.getConnection).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalledWith(
        'DELETE FROM whatsapp_message_queue WHERE id = ?',
        [id]
      );
      expect(await handleError).toHaveBeenCalledWith(
        '[deleteMessageFromQueue] Error deleting message from queue:',
        mockError
      );
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });
});
