import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LocationFilterPopover } from '../components/location-filter-popover';
import { CustomSelect } from '../components/custom-select';
import {
  expandLocationSearchTerms,
  isLocationMatch,
  removeVietnameseDiacritics,
  VIETNAM_PROVINCES,
} from '../utils/vietnam-locations';

describe('Vietnam Locations Utility & Matching', () => {
  it('chứa danh sách các tỉnh thành phố có dấu chuẩn tiếng Việt', () => {
    expect(VIETNAM_PROVINCES).toContain('Hồ Chí Minh');
    expect(VIETNAM_PROVINCES).toContain('Hà Nội');
    expect(VIETNAM_PROVINCES).toContain('Đà Nẵng');
    expect(VIETNAM_PROVINCES).toContain('Bình Dương');
    expect(VIETNAM_PROVINCES).toContain('Bắc Ninh');
    expect(VIETNAM_PROVINCES).toContain('Bà Rịa - Vũng Tàu');
  });

  it('bỏ dấu tiếng Việt chính xác với removeVietnameseDiacritics', () => {
    expect(removeVietnameseDiacritics('Hồ Chí Minh')).toBe('ho chi minh');
    expect(removeVietnameseDiacritics('Đà Nẵng')).toBe('da nang');
    expect(removeVietnameseDiacritics('Bà Rịa - Vũng Tàu')).toBe('ba ria - vung tau');
  });

  it('khi lọc "Hồ Chí Minh", match thành công công việc ghi "Ho Chi Minh City" hoặc "TP.HCM"', () => {
    expect(isLocationMatch('Ho Chi Minh City', ['Hồ Chí Minh'])).toBe(true);
    expect(isLocationMatch('TP.HCM, Quan 1', ['Hồ Chí Minh'])).toBe(true);
    expect(isLocationMatch('Hồ Chí Minh', ['Hồ Chí Minh'])).toBe(true);
    expect(isLocationMatch('Sai Gon', ['Hồ Chí Minh'])).toBe(true);
    // Địa điểm khác không match
    expect(isLocationMatch('Hà Nội', ['Hồ Chí Minh'])).toBe(false);
  });

  it('khi lọc "Hà Nội", match thành công công việc ghi "Ha Noi" hoặc "Hanoi City"', () => {
    expect(isLocationMatch('Ha Noi', ['Hà Nội'])).toBe(true);
    expect(isLocationMatch('Hanoi City', ['Hà Nội'])).toBe(true);
    expect(isLocationMatch('Hà Nội', ['Hà Nội'])).toBe(true);
    expect(isLocationMatch('Da Nang', ['Hà Nội'])).toBe(false);
  });

  it('hỗ trợ lọc nhiều tỉnh thành (multi-select: Hồ Chí Minh, Hà Nội)', () => {
    const selected = ['Hồ Chí Minh', 'Hà Nội'];
    expect(isLocationMatch('Ho Chi Minh City', selected)).toBe(true);
    expect(isLocationMatch('Hanoi', selected)).toBe(true);
    expect(isLocationMatch('Đà Nẵng', selected)).toBe(false);
  });

  it('expandLocationSearchTerms sinh đầy đủ biến thể có dấu, không dấu và alias', () => {
    const variants = expandLocationSearchTerms(['Hồ Chí Minh']);
    expect(variants).toContain('hồ chí minh');
    expect(variants).toContain('ho chi minh');
    expect(variants).toContain('ho chi minh city');
    expect(variants).toContain('tp.hcm');
    expect(variants).toContain('saigon');
  });
});

describe('LocationFilterPopover Component', () => {
  it('opens the location picker with Enter', () => {
    render(
      <LocationFilterPopover id="keyboard-location" label="Địa điểm" value="" onChange={vi.fn()} />,
    );
    fireEvent.keyDown(screen.getByLabelText('Địa điểm'), { key: 'Enter' });
    expect(screen.getByPlaceholderText('Nhập Tỉnh/Thành phố')).toBeInTheDocument();
  });
  it('hiển thị input trigger và mở popover khi click', () => {
    const handleChange = vi.fn();
    render(
      <LocationFilterPopover
        id="search-location"
        label="Địa điểm"
        value=""
        onChange={handleChange}
      />,
    );

    const input = screen.getByLabelText('Địa điểm');
    expect(input).toHaveAttribute('readOnly');

    // Click input để mở popover
    fireEvent.click(input);

    expect(screen.getByPlaceholderText('Nhập Tỉnh/Thành phố')).toBeInTheDocument();
    expect(screen.getByText('Bỏ chọn tất cả')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Áp dụng/ })).toBeInTheDocument();
  });

  it('cho phép gõ tên tỉnh/thành phố để tìm nhanh và tích chọn vào checkbox', () => {
    const handleChange = vi.fn();
    render(
      <LocationFilterPopover
        id="search-location"
        label="Địa điểm"
        value=""
        onChange={handleChange}
      />,
    );

    fireEvent.click(screen.getByLabelText('Địa điểm'));

    const searchInput = screen.getByPlaceholderText('Nhập Tỉnh/Thành phố');
    // Gõ tìm kiếm không dấu
    fireEvent.change(searchInput, { target: { value: 'ho chi minh' } });

    // Hiển thị Hồ Chí Minh với checkbox
    const hcmCheckbox = screen.getByRole('checkbox', { name: 'Hồ Chí Minh' });
    expect(hcmCheckbox).toBeInTheDocument();
    expect(hcmCheckbox).not.toBeChecked();

    // Buộc phải tích vào checkbox mới tính là đã chọn
    fireEvent.click(hcmCheckbox);
    expect(hcmCheckbox).toBeChecked();

    // Nhấn Áp dụng
    fireEvent.click(screen.getByRole('button', { name: /Áp dụng/ }));

    expect(handleChange).toHaveBeenCalledWith('Hồ Chí Minh');
  });

  it('cho phép chọn nhiều tỉnh thành phố trong 1 lượt lọc (multi-select)', () => {
    const handleChange = vi.fn();
    render(
      <LocationFilterPopover
        id="search-location"
        label="Địa điểm"
        value=""
        onChange={handleChange}
      />,
    );

    fireEvent.click(screen.getByLabelText('Địa điểm'));

    const searchInput = screen.getByPlaceholderText('Nhập Tỉnh/Thành phố');

    // Tìm và tick Hà Nội
    fireEvent.change(searchInput, { target: { value: 'Ha Noi' } });
    const hnCheckbox = screen.getByRole('checkbox', { name: 'Hà Nội' });
    fireEvent.click(hnCheckbox);

    // Tìm và tick Hồ Chí Minh
    fireEvent.change(searchInput, { target: { value: 'Ho Chi Minh' } });
    const hcmCheckbox = screen.getByRole('checkbox', { name: 'Hồ Chí Minh' });
    fireEvent.click(hcmCheckbox);

    // Nhấn Áp dụng
    fireEvent.click(screen.getByRole('button', { name: /Áp dụng/ }));

    expect(handleChange).toHaveBeenCalledWith('Hà Nội, Hồ Chí Minh');
  });

  it('nút Bỏ chọn tất cả xóa toàn bộ selection', () => {
    const handleChange = vi.fn();
    render(
      <LocationFilterPopover
        id="search-location"
        label="Địa điểm"
        value="Hà Nội, Hồ Chí Minh"
        onChange={handleChange}
      />,
    );

    fireEvent.click(screen.getByLabelText('Địa điểm'));

    const clearButton = screen.getByText('Bỏ chọn tất cả');
    fireEvent.click(clearButton);

    fireEvent.click(screen.getByRole('button', { name: /Áp dụng/ }));

    expect(handleChange).toHaveBeenCalledWith('');
  });
});

describe('CustomSelect Component (Bo góc tròn như Hình 4)', () => {
  const options = [
    { value: '', label: 'Tất cả hình thức' },
    { value: 'FULL_TIME', label: 'Toàn thời gian (Full-time)' },
    { value: 'PART_TIME', label: 'Bán thời gian (Part-time)' },
  ];

  it('selects an option with the keyboard', () => {
    const handleChange = vi.fn();
    render(
      <CustomSelect
        id="keyboard-jobType"
        label="Hình thức công việc"
        value=""
        onChange={handleChange}
        options={options}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Tất cả hình thức/i }));
    const option = screen.getAllByRole('option', { name: 'Bán thời gian (Part-time)' }).at(-1)!;
    expect(option).toHaveAttribute('tabindex', '0');
    fireEvent.keyDown(option, { key: 'Enter' });
    expect(handleChange).toHaveBeenCalledWith('PART_TIME');
  });

  it('render trigger với label và hiển thị menu dropdown khi click', () => {
    const handleChange = vi.fn();
    render(
      <CustomSelect
        id="search-jobType"
        label="Hình thức công việc"
        value=""
        onChange={handleChange}
        options={options}
      />,
    );

    expect(screen.getByText('Hình thức công việc')).toBeInTheDocument();
    const trigger = screen.getByRole('button', { name: /Tất cả hình thức/i });
    expect(trigger).toBeInTheDocument();

    // Click trigger để mở listbox popover
    fireEvent.click(trigger);

    const listbox = screen.getByRole('listbox', { name: 'Hình thức công việc' });
    expect(listbox).toBeInTheDocument();

    const optionsInListbox = screen.getAllByRole('option', { name: 'Toàn thời gian (Full-time)' });
    const targetOption = optionsInListbox[optionsInListbox.length - 1];
    expect(targetOption).toBeDefined();
    // Click option trong custom dropdown
    fireEvent.click(targetOption!);
    expect(handleChange).toHaveBeenCalledWith('FULL_TIME');
  });
});
