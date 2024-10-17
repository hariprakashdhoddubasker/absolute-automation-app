// tests/services/whatsappQueueService.test.js

// Mock the dependencies
jest.mock('../../../src/repositories/enquiryRepository');
jest.mock('../../../src/repositories/whatsappMessageQueueRepository');
jest.mock('../../../src/services/clientService');
jest.mock('../../../src/utils/responseHelpers');

let whatsappQueueService;
let enquiryRepository;
let whatsappMessageQueueRepository;
let clientService;
let insertQueueEntriesSpy; // Declare the variable here
const { handleError } = require('../../../src/utils/responseHelpers');

describe('WhatsApp Queue Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Import modules
    whatsappQueueService = require('../../../src/services/whatsappQueueService');
    enquiryRepository = require('../../../src/repositories/enquiryRepository');
    whatsappMessageQueueRepository = require('../../../src/repositories/whatsappMessageQueueRepository');
    clientService = require('../../../src/services/clientService');
  });

  afterEach(() => {
    // Restore the spy after each test if it was used
    if (insertQueueEntriesSpy) {
      insertQueueEntriesSpy.mockRestore();
      insertQueueEntriesSpy = null; // Reset for the next test
    }
  });

  /**
   * Test Suite for createQueueEntries function
   * This suite tests creating message queue entries based on audience type,
   * ensuring that entries are correctly prepared and inserted into the queue.
   */
  describe('createQueueEntries', () => {
    /**
     * Test Case: Create queue entries for EnquiryOnly audience
     * Ensures that entries are created from enquiry contacts.
     */
    it('should create queue entries for EnquiryOnly audience', async () => {
      // Arrange
      const message = 'Hello Enquiry!';
      const mediaUrl = 'http://example.com/media.jpg';
      const audienceType = 'EnquiryOnly';

      const enquiries = [
        { name: 'Enquiry One', phone: '1234567890' },
        { name: 'Enquiry Two', phone: '0987654321' },
      ];

      enquiryRepository.getEnquiryNameAndContacts.mockResolvedValue(enquiries);

      // Use jest.spyOn to mock 'insertQueueEntries'
      insertQueueEntriesSpy = jest
        .spyOn(whatsappQueueService, 'insertQueueEntries')
        .mockResolvedValue();

      // Act
      const result = await whatsappQueueService.createQueueEntries(
        message,
        mediaUrl,
        audienceType
      );

      // Assert
      expect(enquiryRepository.getEnquiryNameAndContacts).toHaveBeenCalled();
      expect(insertQueueEntriesSpy).toHaveBeenCalledWith([
        {
          name: 'Enquiry One',
          phone: '1234567890',
          message,
          media_url: mediaUrl,
          filename: null,
          status: 'pending',
        },
        {
          name: 'Enquiry Two',
          phone: '0987654321',
          message,
          media_url: mediaUrl,
          filename: null,
          status: 'pending',
        },
      ]);
      expect(result).toBe('Message queue entries created successfully.');
    });

    /**
     * Test Case: Create queue entries for ClientsOnly audience
     * Ensures that entries are created from client contacts.
     */
    it('should create queue entries for ClientsOnly audience', async () => {
      // Arrange
      const message = 'Hello Client!';
      const mediaUrl = null;
      const audienceType = 'ClientsOnly';

      const clients = [
        { name: 'Client One', phone: '1122334455' },
        { name: 'Client Two', phone: '5566778899' },
      ];

      clientService.getClientContacts.mockResolvedValue(clients);

      // Use jest.spyOn to mock 'insertQueueEntries'
      insertQueueEntriesSpy = jest
        .spyOn(whatsappQueueService, 'insertQueueEntries')
        .mockResolvedValue();

      // Act
      const result = await whatsappQueueService.createQueueEntries(
        message,
        mediaUrl,
        audienceType
      );

      // Assert
      expect(clientService.getClientContacts).toHaveBeenCalled();
      expect(insertQueueEntriesSpy).toHaveBeenCalledWith([
        {
          name: 'Client One',
          phone: '1122334455',
          message,
          media_url: mediaUrl,
          filename: null,
          status: 'pending',
        },
        {
          name: 'Client Two',
          phone: '5566778899',
          message,
          media_url: mediaUrl,
          filename: null,
          status: 'pending',
        },
      ]);
      expect(result).toBe('Message queue entries created successfully.');
    });

    /**
     * Test Case: Create queue entries for Both audience
     * Ensures that entries are created from both enquiries and clients.
     */
    it('should create queue entries for Both audience', async () => {
      // Arrange
      const message = 'Hello Everyone!';
      const mediaUrl = null;
      const audienceType = 'Both';

      const enquiries = [{ name: 'Enquiry One', phone: '1234567890' }];
      const clients = [{ name: 'Client One', phone: '1122334455' }];

      enquiryRepository.getEnquiryNameAndContacts.mockResolvedValue(enquiries);
      clientService.getClientContacts.mockResolvedValue(clients);

      // Use jest.spyOn to mock 'insertQueueEntries'
      insertQueueEntriesSpy = jest
        .spyOn(whatsappQueueService, 'insertQueueEntries')
        .mockResolvedValue();

      // Act
      const result = await whatsappQueueService.createQueueEntries(
        message,
        mediaUrl,
        audienceType
      );

      // Assert
      expect(enquiryRepository.getEnquiryNameAndContacts).toHaveBeenCalled();
      expect(clientService.getClientContacts).toHaveBeenCalled();
      expect(insertQueueEntriesSpy).toHaveBeenCalledWith([
        {
          name: 'Enquiry One',
          phone: '1234567890',
          message,
          media_url: mediaUrl,
          filename: null,
          status: 'pending',
        },
        {
          name: 'Client One',
          phone: '1122334455',
          message,
          media_url: mediaUrl,
          filename: null,
          status: 'pending',
        },
      ]);
      expect(result).toBe('Message queue entries created successfully.');
    });

    /**
     * Test Case: Invalid audience type
     * Ensures that an error is thrown when an invalid audience type is provided.
     */
    it('should handle error for invalid audience type', async () => {
      // Arrange
      const message = 'Hello!';
      const mediaUrl = null;
      const audienceType = 'InvalidType';

      // Mock handleError
      handleError.mockResolvedValue();

      // Spy on insertQueueEntries
      insertQueueEntriesSpy = jest
        .spyOn(whatsappQueueService, 'insertQueueEntries')
        .mockResolvedValue();

      // Act
      const result = await whatsappQueueService.createQueueEntries(
        message,
        mediaUrl,
        audienceType
      );

      // Assert
      expect(handleError).toHaveBeenCalledWith(
        'Invalid audience type. Choose EnquiryOnly, ClientsOnly, or Both.'
      );
      expect(insertQueueEntriesSpy).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  /**
   * Test Suite for insertQueueEntries function
   * This suite tests the insertion of entries into the queue.
   */
  describe('insertQueueEntries', () => {
    /**
     * Test Case: Successful insertion of queue entries
     * Ensures that entries are inserted into the database.
     */
    it('should insert entries into the queue', async () => {
      // Arrange
      const entries = [
        {
          name: 'John Doe',
          phone: '1234567890',
          message: 'Hello!',
          media_url: null,
          filename: null,
          status: 'pending',
        },
      ];

      whatsappMessageQueueRepository.insertQueueEntries.mockResolvedValueOnce();

      // Act
      await whatsappQueueService.insertQueueEntries(entries);

      // Assert
      expect(
        whatsappMessageQueueRepository.insertQueueEntries
      ).toHaveBeenCalledWith(entries);
    });
  });

  /**
   * Test Suite for getHighPriorityQueuedMessages function
   * This suite tests fetching pending messages from the queue.
   */
  describe('getHighPriorityQueuedMessages', () => {
    /**
     * Test Case: Retrieve pending messages within limit
     * Ensures that pending messages are retrieved up to the specified limit.
     */
    it('should retrieve get High Priority Queued Messages within limit', async () => {
      // Arrange
      const limit = 10;
      const pendingMessages = [
        { id: 1, message: 'Message 1' },
        { id: 2, message: 'Message 2' },
      ];

      whatsappMessageQueueRepository.getHighPriorityQueuedMessages.mockResolvedValue(
        pendingMessages
      );

      // Act
      const result = await whatsappQueueService.getHighPriorityQueuedMessages(
        limit
      );

      // Assert
      expect(
        whatsappMessageQueueRepository.getHighPriorityQueuedMessages
      ).toHaveBeenCalledWith(limit);
      expect(result).toEqual(pendingMessages);
    });
  });

  /**
   * Test Suite for getHighPriorityQueuedMessages function
   * This suite tests fetching pending messages from the queue.
   */
  describe('getHighPriorityQueuedMessages', () => {
    /**
     * Test Case: Retrieve pending messages within limit
     * Ensures that pending messages are retrieved up to the specified limit.
     */
    it('should retrieve get High Priority Queued Messages within limit', async () => {
      // Arrange
      const limit = 10;
      const pendingMessages = [
        { id: 1, message: 'Message 1' },
        { id: 2, message: 'Message 2' },
      ];

      whatsappMessageQueueRepository.getHighPriorityQueuedMessages.mockResolvedValue(
        pendingMessages
      );

      // Act
      const result = await whatsappQueueService.getHighPriorityQueuedMessages(
        limit
      );

      // Assert
      expect(
        whatsappMessageQueueRepository.getHighPriorityQueuedMessages
      ).toHaveBeenCalledWith(limit);
      expect(result).toEqual(pendingMessages);
    });
  });

  /**
   * Test Suite: getPendingQueuedMessagesWithLimit
   * Purpose: Verifies that the function retrieves pending messages based on specified priority and limit.
   * Ensures correct parameter usage, compliance with limit, and proper handling when no messages are found.
   */
  describe('getPendingQueuedMessagesWithLimit', () => {
    afterEach(() => {
      jest.clearAllMocks(); // Clear any mocks after each test to avoid interference
    });

    it('should fetch pending messages with the given priority and limit', async () => {
      // Arrange
      const mockPriority = 'normal';
      const mockLimit = 5;
      const mockMessages = [
        { id: 1, priority: 'normal', status: 'pending' },
        { id: 2, priority: 'normal', status: 'pending' },
        // ...more mock messages up to the limit
      ];

      // Mock the repository response
      whatsappMessageQueueRepository.getPendingQueuedMessagesWithLimit.mockResolvedValue(
        mockMessages
      );

      // Act
      const result =
        await whatsappQueueService.getPendingQueuedMessagesWithLimit(
          mockPriority,
          mockLimit
        );

      // Assert
      expect(
        whatsappMessageQueueRepository.getPendingQueuedMessagesWithLimit
      ).toHaveBeenCalledWith(mockPriority, mockLimit);
      expect(result).toEqual(mockMessages);
      expect(result.length).toBeLessThanOrEqual(mockLimit); // Ensures limit is respected
    });

    it('should return an empty array if no messages are found', async () => {
      // Arrange
      const mockPriority = 'normal';
      const mockLimit = 5;
      whatsappMessageQueueRepository.getPendingQueuedMessagesWithLimit.mockResolvedValue(
        []
      );

      // Act
      const result =
        await whatsappQueueService.getPendingQueuedMessagesWithLimit(
          mockPriority,
          mockLimit
        );

      // Assert
      expect(
        whatsappMessageQueueRepository.getPendingQueuedMessagesWithLimit
      ).toHaveBeenCalledWith(mockPriority, mockLimit);
      expect(result).toEqual([]); // Expecting an empty array if no messages are found
    });
  });

  /**
   * Test Suite for deleteMessageFromQueue function
   * This suite tests deleting a message from the queue after processing.
   */
  describe('deleteMessageFromQueue', () => {
    /**
     * Test Case: Successful deletion of a message
     * Ensures that a message is deleted from the queue by ID.
     */
    it('should delete a message from the queue', async () => {
      // Arrange
      const id = 1;

      whatsappMessageQueueRepository.deleteMessageFromQueue.mockResolvedValue();

      // Act
      await whatsappQueueService.deleteMessageFromQueue(id);

      // Assert
      expect(
        whatsappMessageQueueRepository.deleteMessageFromQueue
      ).toHaveBeenCalledWith(id);
    });
  });
});
