// tests/repositories/whatsappMessageQueueRepository.test.js

const whatsappMessageQueueRepository = require('../../../src/repositories/whatsappMessageQueueRepository');
const db = require('../../../src/config/db');
const logger = require('../../../src/utils/logger');

// Mock the getConnection method from the db module
jest.mock('../../../src/config/db');

jest.mock('../../../src/utils/responseHelpers', () => ({
  handleError: jest.fn(),
}));
const { handleError } = require('../../../src/utils/responseHelpers');

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

    // Mock logger methods if needed
    logger.info = jest.fn();
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
        'INSERT INTO whatsapp_message_queue (name, phone, message, media_url, filename, status, priority) VALUES ?',
        [
          [
            [
              entries[0].name,
              entries[0].phone,
              entries[0].message,
              entries[0].media_url,
              entries[0].filename,
              entries[0].status,
              'normal', // Default priority
            ],
            [
              entries[1].name,
              entries[1].phone,
              entries[1].message,
              entries[1].media_url,
              entries[1].filename,
              entries[1].status,
              'normal', // Default priority
            ],
          ],
        ]
      );
      expect(logger.info).toHaveBeenCalledWith('Queue entries inserted successfully.');
      expect(mockConnection.release).toHaveBeenCalled();
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

      // Act
      await whatsappMessageQueueRepository.insertQueueEntries(entries);

      // Assert
      expect(db.getConnection).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        '[insertQueueEntries] Error inserting queue entries:',
        mockError
      );
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('getHighPriorityQueuedMessages', () => {
    it('should fetch high priority messages successfully without limit', async () => {
      // Arrange
      const mockRows = [
        {
          id: 3,
          name: 'Alice',
          phone: '1112223333',
          message: 'High priority message',
          status: 'pending',
          priority: 'high',
        },
      ];
      mockConnection.query.mockResolvedValue([mockRows]);

      // Act
      const result = await whatsappMessageQueueRepository.getHighPriorityQueuedMessages();

      // Assert
      expect(db.getConnection).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalledWith(expect.any(String), []);
      expect(result).toEqual(mockRows);
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should handle errors when fetching high priority messages', async () => {
      // Arrange
      const mockError = new Error('Database error');
      mockConnection.query.mockRejectedValue(mockError);

      // Act
      const result = await whatsappMessageQueueRepository.getHighPriorityQueuedMessages();

      // Assert
      expect(db.getConnection).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        '[getHighPriorityMessages] Error fetching high priority messages:',
        mockError
      );
      expect(result).toBeUndefined();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('getPendingQueuedMessagesWithLimit', () => {
    it('should fetch pending messages with specific priority and limit', async () => {
      // Arrange
      const priority = 'normal';
      const limit = 3;
      const mockRows = [
        {
          id: 5,
          name: 'Charlie',
          phone: '7778889999',
          message: 'Normal priority message',
          status: 'pending',
          priority: 'normal',
        },
      ];
      mockConnection.query.mockResolvedValue([mockRows]);

      // Act
      const result = await whatsappMessageQueueRepository.getPendingQueuedMessagesWithLimit(
        priority,
        limit
      );

      // Assert
      expect(db.getConnection).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalledWith(expect.any(String), [priority, limit]);
      expect(result).toEqual(mockRows);
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should handle errors when fetching pending messages with specific priority and limit', async () => {
      // Arrange
      const priority = 'normal';
      const limit = 3;
      const mockError = new Error('Database error');
      mockConnection.query.mockRejectedValue(mockError);

      // Act
      const result = await whatsappMessageQueueRepository.getPendingQueuedMessagesWithLimit(
        priority,
        limit
      );

      // Assert
      expect(db.getConnection).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalledWith(
        '[getPendingMessagesWithLimit] Error fetching pending messages:',
        mockError
      );
      expect(result).toBeUndefined();
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

      // Act
      await whatsappMessageQueueRepository.deleteMessageFromQueue(id);

      // Assert
      expect(db.getConnection).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalledWith(
        'DELETE FROM whatsapp_message_queue WHERE id = ?',
        [id]
      );
      expect(handleError).toHaveBeenCalledWith(
        '[deleteMessageFromQueue] Error deleting message from queue:',
        mockError
      );
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });
});
