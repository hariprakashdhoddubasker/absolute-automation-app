// tests/services/nurtureScheduleService.test.js

const moment = require('moment');
const nurtureScheduleService = require('../../../src/services/nurtureScheduleService');
const bulkMessageService = require('../../../src/services/bulkMessageService');
const nurtureScheduleRepository = require('../../../src/repositories/nurtureScheduleRepository');
const whatsappMessageQueueRepository = require('../../../src/repositories/whatsappMessageQueueRepository');
const whatsappMessagingService = require('../../../src/services/whatsappMessagingService');
const logger = require('../../../src/utils/logger');

jest.mock('../../../src/services/bulkMessageService');
jest.mock('../../../src/repositories/nurtureScheduleRepository');
jest.mock('../../../src/repositories/whatsappMessageQueueRepository');
jest.mock('../../../src/services/whatsappMessagingService');
jest.mock('../../../src/utils/logger');

describe('nurtureScheduleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
      });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('scheduleNurtureMessages', () => {
    it('should send immediate Day 1 message and schedule remaining messages', async () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      const enquiryData = {
        id: 1,
        name: 'John Doe',
        phone: '+1234567890',
        lead_generated_date: '2023-09-01',
        branch_id: '1',
      };

      const instanceId = 'instance_1';
      whatsappMessagingService.getDefaultInstanceId.mockResolvedValue(
        instanceId
      );
      whatsappMessagingService.sendMessage.mockResolvedValue();
      nurtureScheduleRepository.scheduleNurtureMessage.mockResolvedValue();

      // Mock moment for this test case
      const mockMoment = jest.spyOn(moment.prototype, 'add').mockReturnThis();
      const mockFormat = jest
        .spyOn(moment.prototype, 'format')
        .mockReturnValue('2023-09-03');

      // Act
      await nurtureScheduleService.scheduleNurtureMessages(enquiryData);

      // Assert
      expect(whatsappMessagingService.getDefaultInstanceId).toHaveBeenCalled();
      expect(whatsappMessagingService.sendMessage).toHaveBeenCalledWith({
        name: 'John Doe',
        number: '+1234567890',
        message:
          'Hey *{Name}* 👋 \n\nI noticed you signed up with *The Absolute Fitness*, and I wanted to personally follow up.\n\nWe’re ready to help you *transform in just 3 months!* 💥✨ \n\nAll we need is *YOU to get started*. 💯\n\nReady for more details? \n\nReach out to me anytime 💪\n\n🔥Lets make those fitness goals happen!',
        instanceId: instanceId,
        mediaUrl:
          'https://theabsolutefitness.com/assets/nurture_sequence/1.About.mp4',
          type: 'media',
      });
      expect(logger.info).toHaveBeenCalledWith(
        'Immediate message sent to +1234567890'
      );
      expect(
        nurtureScheduleRepository.scheduleNurtureMessage
      ).toHaveBeenCalledTimes(4); // Remaining 4 messages

      // Clean up mocks
      mockMoment.mockRestore();
      mockFormat.mockRestore();
    });

    it('should handle errors when sending immediate message fails', async () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      const enquiryData = {
        id: 1,
        name: 'John Doe',
        phone: '+1234567890',
        lead_generated_date: '2023-09-01',
        branch_id: '1',
      };

      const instanceId = 'instance_1';
      const error = new Error('Failed to send message');
      whatsappMessagingService.getDefaultInstanceId.mockResolvedValue(
        instanceId
      );
      whatsappMessagingService.sendMessage.mockRejectedValue(error);
      nurtureScheduleRepository.scheduleNurtureMessage.mockResolvedValue();

      // Mock moment
      const mockMoment = jest.spyOn(moment.prototype, 'add').mockReturnThis();
      const mockFormat = jest
        .spyOn(moment.prototype, 'format')
        .mockReturnValue('2023-09-03');

      // Act
      await nurtureScheduleService.scheduleNurtureMessages(enquiryData);

      // Assert
      expect(whatsappMessagingService.getDefaultInstanceId).toHaveBeenCalled();
      expect(whatsappMessagingService.sendMessage).toHaveBeenCalledWith({
        name: 'John Doe',
        number: '+1234567890',
        message:
          'Hey *{Name}* 👋 \n\nI noticed you signed up with *The Absolute Fitness*, and I wanted to personally follow up.\n\nWe’re ready to help you *transform in just 3 months!* 💥✨ \n\nAll we need is *YOU to get started*. 💯\n\nReady for more details? \n\nReach out to me anytime 💪\n\n🔥Lets make those fitness goals happen!',
        instanceId: instanceId,
        mediaUrl:
          'https://theabsolutefitness.com/assets/nurture_sequence/1.About.mp4',
        type: 'media',
      });
      expect(logger.error).toHaveBeenCalledWith(
        `Failed to send immediate message to +1234567890: ${error.message}`
      );
      expect(
        nurtureScheduleRepository.scheduleNurtureMessage
      ).toHaveBeenCalledTimes(4); // Remaining 4 messages

      // Clean up mocks
      mockMoment.mockRestore();
      mockFormat.mockRestore();
    });

    it('should log error when parameters are undefined or null', async () => {
      // Arrange
      const enquiryData = {
        id: null, // Missing id
        name: 'John Doe',
        phone: '+1234567890',
        lead_generated_date: '2023-09-01',
           branch_id: '1'
      };

      whatsappMessagingService.getDefaultInstanceId.mockResolvedValue(
        'instance_1'
      );
      whatsappMessagingService.sendMessage.mockResolvedValue();

      // Mock moment
      const mockMoment = jest.spyOn(moment.prototype, 'add').mockReturnThis();
      const mockFormat = jest
        .spyOn(moment.prototype, 'format')
        .mockReturnValue('2023-09-03');

      // Act
      await nurtureScheduleService.scheduleNurtureMessages(enquiryData);

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to schedule message due to undefined parameter(s):',
        expect.objectContaining({
          enquiryId: null,
          name: 'John Doe',
          number: '+1234567890',
          message: expect.any(String),
          scheduledDate: expect.any(String),
        })
      );
      expect(
        nurtureScheduleRepository.scheduleNurtureMessage
      ).not.toHaveBeenCalled();

      // Clean up mocks
      mockMoment.mockRestore();
      mockFormat.mockRestore();
    });

    it('should not send immediate message if NODE_ENV is not production', async () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      delete process.env.CAN_SEND_WA_MESSAGE; // Ensure it's not set
      const enquiryData = {
        id: 1,
        name: 'John Doe',
        phone: '+1234567890',
        lead_generated_date: '2023-09-01',
        branch_id: '1',
      };

      whatsappMessagingService.getDefaultInstanceId.mockResolvedValue(
        'instance_1'
      );
      whatsappMessagingService.sendMessage.mockResolvedValue();

      // Mock moment
      const mockMoment = jest.spyOn(moment.prototype, 'add').mockReturnThis();
      const mockFormat = jest
        .spyOn(moment.prototype, 'format')
        .mockReturnValue('2023-09-03');

      // Act
      await nurtureScheduleService.scheduleNurtureMessages(enquiryData);

      // Assert
      expect(whatsappMessagingService.sendMessage).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        'Immediate message sent to +1234567890'
      );
      expect(
        nurtureScheduleRepository.scheduleNurtureMessage
      ).toHaveBeenCalledTimes(4);

      // Clean up mocks
      mockMoment.mockRestore();
      mockFormat.mockRestore();
    });
  });

  describe('sendScheduledNurtureMessages', () => {
    it('should process scheduled nurture messages successfully', async () => {
      // Arrange
      const today = '2023-09-03';
      jest.spyOn(moment.prototype, 'format').mockReturnValue(today);

      const scheduledMessages = [
        {
          id: 1,
          name: 'John Doe',
          number: '+1234567890',
          message: 'Test message',
          branch_id: '1',
        },
      ];
      nurtureScheduleRepository.getScheduledMessagesForDate.mockResolvedValue(
        scheduledMessages
      );
      whatsappMessageQueueRepository.insertQueueEntries.mockResolvedValue();
      bulkMessageService.processBulkMessages.mockResolvedValue();
      nurtureScheduleRepository.markMessageAsSent.mockResolvedValue();

      // Act
      await nurtureScheduleService.sendScheduledNurtureMessages();

      // Assert
      expect(
        nurtureScheduleRepository.getScheduledMessagesForDate
      ).toHaveBeenCalledWith(today, 'high');
      expect(
        whatsappMessageQueueRepository.insertQueueEntries
      ).toHaveBeenCalledWith([
        {
          name: 'John Doe',
          phone: '+1234567890',
          message: 'Test message',
          media_url: null,
          filename: null,
          status: 'pending',
          priority: 'high',
             branch_id: '1'
        },
      ]);
      expect(bulkMessageService.processBulkMessages).toHaveBeenCalledWith(
        'high'
      );
      expect(nurtureScheduleRepository.markMessageAsSent).toHaveBeenCalledWith(
        1
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Scheduled nurture messages have been added to the queue.'
      );

      // Clean up mocks
      moment.prototype.format.mockRestore();
    });

    it('should log info when no nurture messages to send', async () => {
      // Arrange
      const today = '2023-09-03';
      jest.spyOn(moment.prototype, 'format').mockReturnValue(today);

      nurtureScheduleRepository.getScheduledMessagesForDate.mockResolvedValue(
        []
      );

      // Act
      await nurtureScheduleService.sendScheduledNurtureMessages();

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        'No nurture messages to send today.'
      );

      // Clean up mocks
      moment.prototype.format.mockRestore();
    });

    it('should handle errors during processing', async () => {
      // Arrange
      const today = '2023-09-03';
      jest.spyOn(moment.prototype, 'format').mockReturnValue(today);

      const scheduledMessages = [
        {
          id: 1,
          name: 'John Doe',
          number: '+1234567890',
          message: 'Test message',
             branch_id: '1'
        },
      ];
      const error = new Error('Processing failed');
      nurtureScheduleRepository.getScheduledMessagesForDate.mockResolvedValue(
        scheduledMessages
      );
      whatsappMessageQueueRepository.insertQueueEntries.mockRejectedValue(
        error
      );

      // Act
      await nurtureScheduleService.sendScheduledNurtureMessages();

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        `Failed to process nurture messages: ${error.message}`
      );

      // Clean up mocks
      moment.prototype.format.mockRestore();
    });
  });
});
