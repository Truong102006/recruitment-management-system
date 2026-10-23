import { randomUUID } from 'node:crypto';
import type {
  Actor,
  IdentityCandidatePort,
  OutboxPort,
  SkillCatalogPort,
} from '../../../../../../libs/contracts/backend';
import type {
  CandidateProfileDto,
  UpdateCandidateProfileRequest,
} from '../../../../../../libs/contracts/public';
import type { UnitOfWork } from '../../../../../../libs/platform/database/unit-of-work';
import { toCandidateProfile } from '../../application/mappers/candidate-application.mapper';
import {
  ApplicationRuleError,
  assertExpectedVersion,
} from '../../application/rules/application-rule.error';
import type {
  CandidateProfileRepository,
  CandidateProfileRow,
} from '../repositories/candidate-profile.repository';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowedFields = new Set([
  'name',
  'phone',
  'headline',
  'summary',
  'location',
  'skillIds',
  'version',
]);

function optionalText(value: unknown, max: number): string | null {
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw new ApplicationRuleError('VALIDATION_FAILED', 'Profile field must be text or null');
  }
  const text = value.trim().normalize('NFC');
  if ([...text].length > max) {
    throw new ApplicationRuleError('VALIDATION_FAILED', 'Profile field is too long');
  }
  return text || null;
}

function requiredName(value: unknown): string {
  const text = optionalText(value, 120);
  if (!text) throw new ApplicationRuleError('VALIDATION_FAILED', 'Name is required');
  return text;
}

function normalizeSkills(value: unknown): string[] {
  if (
    !Array.isArray(value) ||
    value.length > 50 ||
    value.some((id) => typeof id !== 'string' || !uuid.test(id))
  ) {
    throw new ApplicationRuleError('VALIDATION_FAILED', 'Invalid skill IDs');
  }
  return [...new Set(value as string[])].sort();
}

function profileDto(
  name: string,
  email: string,
  profile: CandidateProfileRow,
): CandidateProfileDto {
  return toCandidateProfile({
    name,
    email,
    phone: profile.phone,
    headline: profile.headline,
    summary: profile.summary,
    location: profile.location,
    skillIds: [...profile.skillIds],
    version: profile.version,
  });
}

export class CandidateProfileService {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly identity: IdentityCandidatePort,
    private readonly skills: SkillCatalogPort,
    private readonly profiles: CandidateProfileRepository,
    private readonly outbox: OutboxPort,
  ) {}

  async get(actor: Actor): Promise<CandidateProfileDto> {
    return this.unitOfWork.run(async (tx) => {
      const identity = await this.identity.assertActiveCandidate(actor, tx);
      const profile = await this.profiles.get(identity.userId, tx);
      if (!profile)
        throw new ApplicationRuleError('STATE_CONFLICT', 'Candidate profile is missing');
      return profileDto(identity.name, identity.email, profile);
    });
  }

  async patch(actor: Actor, input: UpdateCandidateProfileRequest): Promise<CandidateProfileDto> {
    if (
      !input ||
      typeof input !== 'object' ||
      Array.isArray(input) ||
      Object.keys(input).some((key) => !allowedFields.has(key))
    ) {
      throw new ApplicationRuleError('VALIDATION_FAILED', 'Unknown profile field');
    }
    const name = input.name === undefined ? undefined : requiredName(input.name);
    const phone = input.phone === undefined ? undefined : optionalText(input.phone, 20);
    const headline = input.headline === undefined ? undefined : optionalText(input.headline, 160);
    const summary = input.summary === undefined ? undefined : optionalText(input.summary, 3000);
    const location = input.location === undefined ? undefined : optionalText(input.location, 160);
    const skillIds = input.skillIds === undefined ? undefined : normalizeSkills(input.skillIds);

    return this.unitOfWork.run(async (tx) => {
      const identity = await this.identity.assertActiveCandidate(actor, tx);
      const current = await this.profiles.getForUpdate(identity.userId, tx);
      if (!current)
        throw new ApplicationRuleError('STATE_CONFLICT', 'Candidate profile is missing');
      assertExpectedVersion(input.version, current.version);
      if (skillIds !== undefined) {
        const active = await this.skills.assertActiveSkills(skillIds, tx);
        if (
          new Set(active).size !== skillIds.length ||
          active.some((id) => !skillIds.includes(id))
        ) {
          throw new ApplicationRuleError('VALIDATION_FAILED', 'Inactive or unknown skill');
        }
      }
      if (name !== undefined) await this.identity.updateCandidateName(actor, name, tx);
      const updated = {
        phone: phone === undefined ? current.phone : phone,
        headline: headline === undefined ? current.headline : headline,
        summary: summary === undefined ? current.summary : summary,
        location: location === undefined ? current.location : location,
      };
      const nextVersion = await this.profiles.update(identity.userId, current.version, updated, tx);
      if (nextVersion === null) {
        throw new ApplicationRuleError('VERSION_CONFLICT', 'Candidate profile version changed');
      }
      if (skillIds !== undefined) await this.profiles.replaceSkills(identity.userId, skillIds, tx);
      await this.outbox.append(
        {
          eventId: randomUUID(),
          eventType: 'candidate.profile_updated',
          schemaVersion: 1,
          aggregateId: identity.userId,
          aggregateVersion: nextVersion,
          occurredAt: new Date().toISOString(),
          payload: { candidateId: identity.userId },
        },
        tx,
      );
      return profileDto(name ?? identity.name, identity.email, {
        userId: identity.userId,
        ...updated,
        skillIds: skillIds ?? current.skillIds,
        version: nextVersion,
      });
    });
  }
}
