import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { CreateInvoiceItemDto } from './dto/create-invoice-item.dto';
import { InvoiceResponseDto } from './dto/invoice-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AppRole } from '../../common/enums/app-role.enum';
import { PaymentStatus } from '../../common/enums/payment-status.enum';

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @Roles(AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully', type: InvoiceResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.invoicesService.create(createInvoiceDto, userId);
  }

  @Get()
  @Roles(AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER, AppRole.PARENT)
  @ApiOperation({ summary: 'Get all invoices' })
  @ApiQuery({ name: 'schoolId', required: false, type: String })
  @ApiQuery({ name: 'parentId', required: false, type: String })
  @ApiQuery({ name: 'studentId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of invoices', type: [InvoiceResponseDto] })
  async findAll(
    @Query('schoolId') schoolId?: string,
    @Query('parentId') parentId?: string,
    @Query('studentId') studentId?: string,
    @Query('status') status?: PaymentStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.invoicesService.findAll({
      schoolId,
      parentId,
      studentId,
      status,
      limit: limit ? parseInt(limit.toString(), 10) : undefined,
      offset: offset ? parseInt(offset.toString(), 10) : undefined,
    });
  }

  @Get(':id')
  @Roles(AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER, AppRole.PARENT)
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiResponse({ status: 200, description: 'Invoice found', type: InvoiceResponseDto })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.findOne(id);
  }

  @Get('number/:invoiceNumber')
  @Roles(AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER, AppRole.PARENT)
  @ApiOperation({ summary: 'Get invoice by invoice number' })
  @ApiResponse({ status: 200, description: 'Invoice found', type: InvoiceResponseDto })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async findByInvoiceNumber(@Param('invoiceNumber') invoiceNumber: string) {
    return this.invoicesService.findByInvoiceNumber(invoiceNumber);
  }

  @Patch(':id')
  @Roles(AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({ summary: 'Update an invoice' })
  @ApiResponse({ status: 200, description: 'Invoice updated successfully', type: InvoiceResponseDto })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ) {
    return this.invoicesService.update(id, updateInvoiceDto);
  }

  @Delete(':id')
  @Roles(AppRole.SCHOOL_ADMIN, AppRole.SCHOOL_OWNER)
  @ApiOperation({ summary: 'Delete an invoice' })
  @ApiResponse({ status: 200, description: 'Invoice deleted successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.invoicesService.remove(id);
    return { message: 'Invoice deleted successfully' };
  }

  @Post(':id/items')
  @Roles(AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({ summary: 'Add an item to an invoice' })
  @ApiResponse({ status: 201, description: 'Item added successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async addItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createItemDto: CreateInvoiceItemDto,
  ) {
    return this.invoicesService.addItem(id, createItemDto);
  }

  @Delete(':id/items/:itemId')
  @Roles(AppRole.SCHOOL_ADMIN, AppRole.ADMISSIONS_STAFF, AppRole.SCHOOL_OWNER)
  @ApiOperation({ summary: 'Remove an item from an invoice' })
  @ApiResponse({ status: 200, description: 'Item removed successfully' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    await this.invoicesService.removeItem(id, itemId);
    return { message: 'Item removed successfully' };
  }
}



